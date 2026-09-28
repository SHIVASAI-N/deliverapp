import { DatabaseService } from '../db/in-memory-db.service';
import { IRider, IRiderLocation, ILiveTrackingState, OrderStatus } from '@deliverapp/types';
import { AppWebSocketGateway } from '../gateway/app.gateway';
import { GeoRedisService } from './geo-redis.service';
import { GoogleMapsService } from '../maps/maps.service';

export class DeliveryService {
  private db = DatabaseService.getInstance();
  private gateway = AppWebSocketGateway.getInstance();
  private geoRedis = GeoRedisService.getInstance();
  private mapsService = GoogleMapsService.getInstance();

  constructor() {
    // Seed initial coordinates in Geo index
    for (const rider of this.db.riders.values()) {
      if (rider.currentLocation) {
        this.geoRedis.geoAddRider(
          rider.id,
          rider.currentLocation.latitude,
          rider.currentLocation.longitude
        );
      }
    }
  }

  /**
   * High-frequency hot location update (called every 3-5s by rider app)
   * Stored in Redis hot cache & broadcast to active order room.
   */
  async updateLocation(
    riderId: string, 
    location: Omit<IRiderLocation, 'riderId' | 'timestamp'>, 
    orderId?: string
  ): Promise<{ success: boolean; etaMinutes?: number }> {
    const rider = this.db.riders.get(riderId);
    if (!rider) throw new Error(`Rider ${riderId} not found.`);

    const fullLocation: IRiderLocation = {
      ...location,
      riderId,
      orderId,
      timestamp: Date.now()
    };

    rider.currentLocation = fullLocation;

    // Security & State validation if orderId is attached
    if (orderId) {
      const order = this.db.orders.get(orderId);
      if (!order) throw new Error(`Order ${orderId} not found.`);

      // Validate rider assignment
      if (rider.currentOrderId && rider.currentOrderId !== orderId) {
        throw new Error(`Rider ${riderId} is not assigned to order ${orderId}.`);
      }

      // Stop tracking if order is already completed
      if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
        this.geoRedis.clearOrder(orderId);
        return { success: true };
      }

      // Store in Redis GEO and Order Location hash
      this.geoRedis.setOrderLocationHash(orderId, fullLocation);

      // Broadcast to specific order room over WebSocket
      this.gateway.broadcastRiderLocation({
        orderId,
        riderId,
        location: fullLocation
      });

      // Check / update cached route ETA if moving towards destination
      if (order.deliveryAddress?.latitude && order.deliveryAddress?.longitude) {
        const route = await this.mapsService.computeRoute(
          { lat: location.latitude, lng: location.longitude },
          { lat: order.deliveryAddress.latitude, lng: order.deliveryAddress.longitude }
        );
        return { success: true, etaMinutes: route.etaMinutes };
      }
    } else {
      this.geoRedis.geoAddRider(riderId, location.latitude, location.longitude);
    }

    return { success: true };
  }

  /**
   * Retrieves complete live tracking state on reconnect or page load
   */
  async getLiveTrackingState(orderId: string): Promise<ILiveTrackingState> {
    const order = this.db.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found.`);

    const restaurant = this.db.restaurants.get(order.restaurantId);
    if (!restaurant) throw new Error('Restaurant not found');

    const rider = Array.from(this.db.riders.values())[0]; // Primary Julian K.
    const lastLocation = this.geoRedis.getOrderLocationHash(orderId) || rider?.currentLocation || null;

    let route = null;
    if (restaurant.address.latitude && order.deliveryAddress?.latitude) {
      const origin = lastLocation 
        ? { lat: lastLocation.latitude, lng: lastLocation.longitude }
        : { lat: restaurant.address.latitude, lng: restaurant.address.longitude };

      const dest = {
        lat: order.deliveryAddress.latitude,
        lng: order.deliveryAddress.longitude
      };

      route = await this.mapsService.computeRoute(origin, dest);
    }

    const isStale = lastLocation ? this.geoRedis.isLocationStale(orderId, 30) : false;

    return {
      orderId: order.id,
      status: order.status,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        latitude: restaurant.address.latitude,
        longitude: restaurant.address.longitude,
        address: `${restaurant.address.street}, ${restaurant.address.area}`
      },
      destination: {
        label: order.deliveryAddress?.label || 'Destination',
        street: order.deliveryAddress?.street || '42 Artisan Row',
        latitude: order.deliveryAddress?.latitude || 9.9275,
        longitude: order.deliveryAddress?.longitude || 76.2600
      },
      rider: rider ? {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
        vehiclePlate: rider.vehiclePlate,
        vehicleType: rider.vehicleType,
        rating: rider.rating,
        avatarUrl: rider.avatarUrl
      } : null,
      riderLocation: lastLocation,
      route,
      isStale,
      lastUpdatedAt: Date.now()
    };
  }

  /**
   * Nearest available rider search for dispatch
   */
  findNearestRiders(lat: number, lng: number, radiusKm = 5) {
    return this.geoRedis.geoSearchNearestRiders(lat, lng, radiusKm);
  }

  getRider(riderId: string): IRider {
    const rider = this.db.riders.get(riderId);
    if (!rider) throw new Error(`Rider ${riderId} not found.`);
    return rider;
  }

  getAllRiders(): IRider[] {
    return Array.from(this.db.riders.values());
  }
}
