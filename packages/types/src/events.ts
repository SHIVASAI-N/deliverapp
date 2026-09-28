import { OrderStatus, IOrderAuditLog } from './order';
import { IRiderLocation } from './delivery';

export enum SocketEvents {
  // Client -> Server
  JOIN_ORDER_ROOM = 'order:join_room',
  LEAVE_ORDER_ROOM = 'order:leave_room',
  RIDER_LOCATION_UPDATE = 'rider:location_update',
  RESTAURANT_SUBSCRIBE = 'restaurant:subscribe',

  // Server -> Client
  ORDER_STATUS_CHANGED = 'order:status_changed',
  ORDER_NEW_INCOMING = 'order:new_incoming',
  RIDER_LOCATION_STREAM = 'rider:location_stream',
  RIDER_JOB_OFFER = 'rider:job_offer'
}

export interface IOrderStatusChangedPayload {
  orderId: string;
  status: OrderStatus;
  auditLog: IOrderAuditLog;
  updatedAt: string;
}

export interface IRiderLocationPayload {
  orderId: string;
  riderId: string;
  location: IRiderLocation;
}
