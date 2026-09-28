import { DatabaseService } from '../db/in-memory-db.service';
import {
  IOrder,
  OrderStatus,
  IOrderBill,
  IOrderItem
} from '@deliverapp/types';
import { OrderStateMachine } from '../../common/state-machine/order-state-machine';
import { AppWebSocketGateway } from '../gateway/app.gateway';
import { IdempotencyStore } from '../../common/interceptors/idempotency.interceptor';

export class OrderService {
  private db = DatabaseService.getInstance();
  private gateway = AppWebSocketGateway.getInstance();

  calculateBill(items: any[], couponCode?: string, isGold = true): IOrderBill {
    let subtotal = 0;
    for (const item of items) {
      let unitPrice = item.unitPrice;
      if (unitPrice === undefined || unitPrice === null) {
        const dbItem = item.menuItemId ? this.db.menuItems.get(item.menuItemId) : null;
        unitPrice = dbItem ? dbItem.price : 0;
        if (item.selectedOptions && Array.isArray(item.selectedOptions)) {
          for (const opt of item.selectedOptions) {
            unitPrice += opt.priceDelta || 0;
          }
        }
      }
      subtotal += unitPrice * (item.quantity || 1);
    }

    const tax = Math.round(subtotal * 0.05); // 5% GST
    const deliveryFee = isGold ? 0 : 49;
    const riderTip = subtotal > 0 ? 50 : 0;

    let discount = 0;
    if (couponCode === 'EPICURE20' && subtotal >= 499) {
      discount = Math.min(149, Math.round(subtotal * 0.2));
    }

    const total = Math.max(0, subtotal + tax + deliveryFee + riderTip - discount);

    return {
      subtotal,
      tax,
      deliveryFee,
      riderTip,
      discount,
      couponCode,
      total
    };
  }

  createOrder(payload: {
    customerId: string;
    restaurantId: string;
    items: IOrderItem[];
    deliveryAddressId?: string;
    couponCode?: string;
    paymentMode?: 'RAZORPAY' | 'STRIPE' | 'COD';
    idempotencyKey?: string;
  }): IOrder {
    // 1. Idempotency Check
    if (payload.idempotencyKey) {
      const existing = IdempotencyStore.get(payload.idempotencyKey);
      if (existing) {
        return existing.responseBody;
      }
    }

    const customer = this.db.users.get(payload.customerId);
    if (!customer) throw new Error('Customer profile not found.');

    const restaurant = this.db.restaurants.get(payload.restaurantId);
    if (!restaurant) throw new Error('Restaurant not found.');

    const address = customer.addresses.find(a => a.id === payload.deliveryAddressId) || customer.addresses[0];
    if (!address) throw new Error('No valid delivery address selected.');

    const hydratedItems: IOrderItem[] = payload.items.map(it => {
      const dbItem = this.db.menuItems.get(it.menuItemId);
      let unitPrice = it.unitPrice || (dbItem ? dbItem.price : 0);
      if (it.selectedOptions) {
        for (const opt of it.selectedOptions) unitPrice += opt.priceDelta || 0;
      }
      return {
        menuItemId: it.menuItemId,
        name: it.name || (dbItem ? dbItem.name : 'Curated Dish'),
        unitPrice,
        quantity: it.quantity || 1,
        selectedOptions: it.selectedOptions || [],
        totalPrice: unitPrice * (it.quantity || 1)
      };
    });

    const bill = this.calculateBill(hydratedItems, payload.couponCode, customer.isGoldMember);

    const orderId = 'EP-' + Math.floor(1000 + Math.random() * 9000);

    const order: IOrder = {
      id: orderId,
      customerId: customer.id,
      customerName: customer.name || 'Patron',
      customerPhone: customer.phone,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      items: hydratedItems,
      bill,
      deliveryAddress: {
        label: address.label,
        street: address.street,
        area: address.area,
        city: address.city,
        latitude: address.latitude,
        longitude: address.longitude
      },
      status: OrderStatus.PLACED,
      paymentId: 'pay_' + Math.random().toString(36).substring(2, 9),
      paymentMode: payload.paymentMode || 'RAZORPAY',
      idempotencyKey: payload.idempotencyKey,
      estimatedDeliveryMinutes: 28,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditLogs: [
        {
          id: 'log_' + Math.random().toString(36).substring(2, 9),
          orderId,
          previousStatus: OrderStatus.PLACED,
          newStatus: OrderStatus.PLACED,
          changedBy: 'CUSTOMER',
          reason: 'Order placed by customer',
          timestamp: new Date().toISOString()
        }
      ]
    };

    // Transactional save to state store
    this.db.orders.set(order.id, order);

    // Record idempotency
    if (payload.idempotencyKey) {
      IdempotencyStore.set(payload.idempotencyKey, {
        key: payload.idempotencyKey,
        method: 'POST',
        endpoint: '/api/v1/orders',
        statusCode: 201,
        responseBody: order,
        createdAt: new Date().toISOString()
      });
    }

    // Broadcast to restaurant dashboard
    this.gateway.broadcastNewOrderToRestaurant(restaurant.id, order);

    return order;
  }

  updateOrderStatus(
    orderId: string,
    nextStatus: OrderStatus,
    changedBy: string,
    reason?: string
  ): IOrder {
    const order = this.db.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found.`);

    // Formal State Machine transition validation & audit logging
    const { status, auditLog } = OrderStateMachine.transition(
      order.status,
      nextStatus,
      order.id,
      changedBy,
      reason
    );

    order.status = status;
    order.updatedAt = new Date().toISOString();
    order.auditLogs.push(auditLog);

    // Trigger auto-dispatch algorithm when restaurant starts preparing
    if (nextStatus === OrderStatus.PREPARING && !order.riderId) {
      this.autoAssignRider(order);
    }

    // Broadcast state machine event to all subscribers via WebSocket
    this.gateway.broadcastOrderStatus({
      orderId: order.id,
      status: order.status,
      auditLog,
      updatedAt: order.updatedAt
    });

    return order;
  }

  private autoAssignRider(order: IOrder) {
    const availableRider = Array.from(this.db.riders.values()).find(r => r.status === 'IDLE');
    if (availableRider) {
      availableRider.status = 'BUSY';
      order.riderId = availableRider.id;
    }
  }

  getOrderById(id: string): IOrder {
    const order = this.db.orders.get(id);
    if (!order) throw new Error(`Order ${id} not found.`);
    return order;
  }

  getCustomerOrders(customerId: string): IOrder[] {
    return Array.from(this.db.orders.values())
      .filter(o => o.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getRestaurantOrders(restaurantId: string): IOrder[] {
    return Array.from(this.db.orders.values())
      .filter(o => o.restaurantId === restaurantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
