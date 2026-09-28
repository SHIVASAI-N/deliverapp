export enum OrderStatus {
  PLACED = 'PLACED',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  PICKED_UP = 'PICKED_UP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PLACED]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
  [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: []
};

export function isValidOrderTransition(current: OrderStatus, next: OrderStatus): boolean {
  const allowed = VALID_ORDER_TRANSITIONS[current];
  return allowed ? allowed.includes(next) : false;
}

export interface IOrderAuditLog {
  id: string;
  orderId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  changedBy: string; // 'CUSTOMER' | 'RESTAURANT' | 'RIDER' | 'SYSTEM'
  reason?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface IOrderItemOption {
  name: string;
  choice: string;
  priceDelta: number;
}

export interface IOrderItem {
  id: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  options?: IOrderItemOption[];
  notes?: string;
}

export interface IOrderBill {
  subtotal: number;
  tax: number; // 5% GST
  deliveryFee: number;
  riderTip: number;
  discount: number;
  couponCode?: string;
  total: number;
}

export interface IOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  riderId?: string;
  items: IOrderItem[];
  bill: IOrderBill;
  deliveryAddress: {
    label: string;
    street: string;
    area: string;
    city: string;
    latitude: number;
    longitude: number;
    instructions?: string;
  };
  status: OrderStatus;
  paymentId: string;
  paymentMode: 'RAZORPAY' | 'STRIPE' | 'COD';
  idempotencyKey?: string;
  estimatedDeliveryMinutes: number;
  createdAt: string;
  updatedAt: string;
  auditLogs: IOrderAuditLog[];
}
