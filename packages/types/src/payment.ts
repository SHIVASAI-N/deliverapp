export type PaymentGateway = 'RAZORPAY' | 'STRIPE' | 'COD';
export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';

export interface IPaymentIntent {
  id: string;
  orderId: string;
  gateway: PaymentGateway;
  amount: number; // In sub-units (e.g. paise / cents)
  currency: 'INR' | 'USD';
  status: PaymentStatus;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  idempotencyKey: string;
  createdAt: string;
  capturedAt?: string;
}

export interface ICreatePaymentIntentDto {
  orderId: string;
  amount: number;
  currency?: 'INR' | 'USD';
  gateway: PaymentGateway;
  idempotencyKey: string;
}

export interface IIdempotencyRecord<T = any> {
  key: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseBody: T;
  createdAt: string;
}
