export type RiderStatus = 'OFFLINE' | 'IDLE' | 'BUSY';

export interface IRiderLocation {
  riderId: string;
  orderId?: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  speedKmh?: number;
  batteryLevel?: number;
  timestamp: number;
}

export interface IRider {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  vehicleType: 'ELECTRIC_VESPA' | 'MOTORCYCLE' | 'BICYCLE';
  vehiclePlate: string;
  rating: number;
  totalDeliveries: number;
  status: RiderStatus;
  currentLocation?: IRiderLocation;
  currentOrderId?: string;
}

export interface IRouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface IRoutePolyline {
  encodedPolyline: string;
  coordinates: IRouteCoordinate[];
  durationSeconds: number;
  distanceMeters: number;
  etaMinutes: number;
  computedAt: number;
}

export interface IDeliveryDispatchJob {
  orderId: string;
  restaurantId: string;
  restaurantLocation: { latitude: number; longitude: number };
  customerLocation: { latitude: number; longitude: number };
  assignedRiderId?: string;
  distanceKm: number;
  estimatedMinutes: number;
  route?: IRoutePolyline;
}

export interface ILiveTrackingState {
  orderId: string;
  status: string;
  restaurant: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  };
  destination: {
    label: string;
    latitude: number;
    longitude: number;
    street: string;
  };
  rider: {
    id: string;
    name: string;
    phone: string;
    vehiclePlate: string;
    vehicleType: string;
    rating: number;
    avatarUrl?: string;
  } | null;
  riderLocation: IRiderLocation | null;
  route: IRoutePolyline | null;
  isStale: boolean;
  lastUpdatedAt: number;
}
