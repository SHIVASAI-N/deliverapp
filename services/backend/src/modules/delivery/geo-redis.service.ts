import { IRiderLocation } from '@deliverapp/types';

interface GeoLocationEntry {
  latitude: number;
  longitude: number;
  riderId: string;
}

export class GeoRedisService {
  private static instance: GeoRedisService;

  // In-memory Redis simulation for GEOADD and GEOSEARCH
  private riderGeoIndex: Map<string, GeoLocationEntry> = new Map();
  // Order hot location hash (HSET order:<orderId>:location)
  private orderHotHashes: Map<string, IRiderLocation> = new Map();
  // Breadcrumb persistence throttle map (persists to DB only every 30-60s)
  private lastPersistedBreadcrumb: Map<string, number> = new Map();
  // Location breadcrumbs history per order
  public orderBreadcrumbs: Map<string, IRiderLocation[]> = new Map();

  private constructor() {}

  static getInstance(): GeoRedisService {
    if (!GeoRedisService.instance) {
      GeoRedisService.instance = new GeoRedisService();
    }
    return GeoRedisService.instance;
  }

  /**
   * Redis GEOADD command: updates rider coordinates in the geospatial index
   */
  geoAddRider(riderId: string, latitude: number, longitude: number): void {
    this.riderGeoIndex.set(riderId, { riderId, latitude, longitude });
  }

  /**
   * Redis GEOSEARCH command: finds nearest available riders within radius
   */
  geoSearchNearestRiders(
    originLat: number,
    originLng: number,
    radiusKm: number = 5.0
  ): { riderId: string; distanceKm: number }[] {
    const results: { riderId: string; distanceKm: number }[] = [];

    for (const [riderId, loc] of this.riderGeoIndex.entries()) {
      const dLat = (loc.latitude - originLat) * 111;
      const dLng = (loc.longitude - originLng) * 111 * Math.cos(originLat * Math.PI / 180);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);

      if (dist <= radiusKm) {
        results.push({ riderId, distanceKm: Number(dist.toFixed(2)) });
      }
    }

    return results.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /**
   * Redis HSET order:<orderId>:location
   */
  setOrderLocationHash(orderId: string, location: IRiderLocation): void {
    this.orderHotHashes.set(orderId, location);
    this.geoAddRider(location.riderId, location.latitude, location.longitude);

    // Throttled persistence: Save breadcrumb only every 30 seconds
    const now = Date.now();
    const lastSaved = this.lastPersistedBreadcrumb.get(orderId) || 0;

    if (now - lastSaved >= 30_000) {
      this.lastPersistedBreadcrumb.set(orderId, now);
      const existing = this.orderBreadcrumbs.get(orderId) || [];
      existing.push(location);
      this.orderBreadcrumbs.set(orderId, existing);
    }
  }

  /**
   * Redis HGETALL order:<orderId>:location
   */
  getOrderLocationHash(orderId: string): IRiderLocation | null {
    return this.orderHotHashes.get(orderId) || null;
  }

  /**
   * Check if location is stale (> 30 seconds without updates)
   */
  isLocationStale(orderId: string, thresholdSeconds: number = 30): boolean {
    const loc = this.orderHotHashes.get(orderId);
    if (!loc) return true;
    return (Date.now() - loc.timestamp) > (thresholdSeconds * 1000);
  }

  clearOrder(orderId: string): void {
    this.orderHotHashes.delete(orderId);
    this.lastPersistedBreadcrumb.delete(orderId);
  }
}
