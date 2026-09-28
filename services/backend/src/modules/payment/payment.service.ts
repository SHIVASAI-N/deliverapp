import { DatabaseService } from '../db/in-memory-db.service';
import { IPaymentIntent, ICreatePaymentIntentDto, OrderStatus } from '@deliverapp/types';
import { IdempotencyStore } from '../../common/interceptors/idempotency.interceptor';
import { OrderService } from '../order/order.service';

export class PaymentService {
  private db = DatabaseService.getInstance();
  private orderService = new OrderService();

  createPaymentIntent(dto: ICreatePaymentIntentDto): IPaymentIntent {
    // 1. Idempotency Check
    if (dto.idempotencyKey && IdempotencyStore.has(dto.idempotencyKey)) {
      return IdempotencyStore.get(dto.idempotencyKey)!.responseBody;
    }

    const order = this.db.orders.get(dto.orderId);
    if (!order) throw new Error(`Order ${dto.orderId} not found.`);

    const intentId = 'pi_' + Math.random().toString(36).substring(2, 10);
    const intent: IPaymentIntent = {
      id: intentId,
      orderId: dto.orderId,
      gateway: dto.gateway,
      amount: Math.round(dto.amount * 100), // In paise / cents
      currency: dto.currency || 'INR',
      status: 'AUTHORIZED',
      gatewayOrderId: 'order_' + Math.random().toString(36).substring(2, 10),
      gatewayPaymentId: 'pay_' + Math.random().toString(36).substring(2, 10),
      idempotencyKey: dto.idempotencyKey,
      createdAt: new Date().toISOString()
    };

    this.db.paymentIntents.set(intent.id, intent);

    if (dto.idempotencyKey) {
      IdempotencyStore.set(dto.idempotencyKey, {
        key: dto.idempotencyKey,
        method: 'POST',
        endpoint: '/api/v1/payments/intent',
        statusCode: 201,
        responseBody: intent,
        createdAt: new Date().toISOString()
      });
    }

    return intent;
  }

  handleWebhook(payload: { event: string; paymentId: string; orderId: string }): { received: boolean } {
    if (payload.event === 'payment.captured') {
      const order = this.db.orders.get(payload.orderId);
      if (order && order.status === OrderStatus.PLACED) {
        this.orderService.updateOrderStatus(order.id, OrderStatus.ACCEPTED, 'SYSTEM', 'Payment webhook verification succeeded');
      }
    }
    return { received: true };
  }
}
