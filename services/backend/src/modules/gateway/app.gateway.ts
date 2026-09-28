import { SocketEvents, IOrderStatusChangedPayload, IRiderLocationPayload } from '@deliverapp/types';
import { DatabaseService } from '../db/in-memory-db.service';

export interface IRealtimeSocket {
  send: (msg: string) => void;
  readyState?: number;
}

export class AppWebSocketGateway {
  private static instance: AppWebSocketGateway;
  private orderSubscriptions: Map<string, Set<IRealtimeSocket>> = new Map();
  private restaurantSubscriptions: Map<string, Set<IRealtimeSocket>> = new Map();

  static getInstance(): AppWebSocketGateway {
    if (!AppWebSocketGateway.instance) {
      AppWebSocketGateway.instance = new AppWebSocketGateway();
    }
    return AppWebSocketGateway.instance;
  }

  subscribeOrder(orderId: string, socket: IRealtimeSocket) {
    if (!this.orderSubscriptions.has(orderId)) {
      this.orderSubscriptions.set(orderId, new Set());
    }
    this.orderSubscriptions.get(orderId)!.add(socket);
  }

  unsubscribeOrder(orderId: string, socket: IRealtimeSocket) {
    if (this.orderSubscriptions.has(orderId)) {
      this.orderSubscriptions.get(orderId)!.delete(socket);
    }
  }

  subscribeRestaurant(restaurantId: string, socket: IRealtimeSocket) {
    if (!this.restaurantSubscriptions.has(restaurantId)) {
      this.restaurantSubscriptions.set(restaurantId, new Set());
    }
    this.restaurantSubscriptions.get(restaurantId)!.add(socket);
  }

  handleRiderLocation(orderId: string, riderId: string, location: { latitude: number; longitude: number }) {
    DatabaseService.getInstance().riderHotLocations.set(riderId, {
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: Date.now()
    });
    this.broadcastRiderLocation({
      orderId,
      riderId,
      location: {
        riderId,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: Date.now()
      }
    });
  }

  broadcastOrderStatus(payload: IOrderStatusChangedPayload) {
    const clients = this.orderSubscriptions.get(payload.orderId);
    const msg = JSON.stringify({ event: SocketEvents.ORDER_STATUS_CHANGED, data: payload });
    if (clients) {
      for (const client of clients) {
        try {
          client.send(msg);
        } catch (e) {}
      }
    }
  }

  broadcastRiderLocation(payload: IRiderLocationPayload) {
    const clients = this.orderSubscriptions.get(payload.orderId);
    const msg = JSON.stringify({ event: SocketEvents.RIDER_LOCATION_STREAM, data: payload });
    if (clients) {
      for (const client of clients) {
        try {
          client.send(msg);
        } catch (e) {}
      }
    }
  }

  broadcastNewOrderToRestaurant(restaurantId: string, order: any) {
    const clients = this.restaurantSubscriptions.get(restaurantId);
    const msg = JSON.stringify({ event: SocketEvents.ORDER_NEW_INCOMING, data: order });
    if (clients) {
      for (const client of clients) {
        try {
          client.send(msg);
        } catch (e) {}
      }
    }
  }

  removeSocket(socket: IRealtimeSocket) {
    for (const clients of this.orderSubscriptions.values()) {
      clients.delete(socket);
    }
    for (const clients of this.restaurantSubscriptions.values()) {
      clients.delete(socket);
    }
  }
}
