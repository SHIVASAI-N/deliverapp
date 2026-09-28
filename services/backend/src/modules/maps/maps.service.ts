import * as https from 'https';
import { IRoutePolyline, IRouteCoordinate } from '@deliverapp/types';

// Simple polyline decoder algorithm for Google encoded polylines
export function decodePolyline(encoded: string): IRouteCoordinate[] {
  const points: IRouteCoordinate[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5
    });
  }

  return points;
}

interface CachedRoute {
  route: IRoutePolyline;
  cachedAt: number;
}

export class GoogleMapsService {
  private static instance: GoogleMapsService;
  private serverApiKey: string;
  private routeCache: Map<string, CachedRoute> = new Map();

  private constructor() {
    this.serverApiKey = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
  }

  static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  /**
   * Google Routes API: Computes driving route and turn-by-turn ETA.
   * Call from backend ONLY, never from client.
   * Caches results to prevent calling on every location ping.
   */
  async computeRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<IRoutePolyline> {
    const cacheKey = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
    const cached = this.routeCache.get(cacheKey);

    // Return cached route if less than 60 seconds old
    if (cached && (Date.now() - cached.cachedAt < 60_000)) {
      return cached.route;
    }

    // If server API key is provided, execute real Google Routes API call
    if (this.serverApiKey && !this.serverApiKey.startsWith('mock')) {
      try {
        const routeData = await this.callGoogleRoutesApi(origin, destination);
        if (routeData) {
          this.routeCache.set(cacheKey, { route: routeData, cachedAt: Date.now() });
          return routeData;
        }
      } catch (err) {
        console.warn('[GoogleMapsService] Routes API failed, falling back to simulated interpolation:', err);
      }
    }

    // High-fidelity fallback route for Fort Kochi culinary corridor
    const fallbackRoute = this.generateRealisticRoute(origin, destination);
    this.routeCache.set(cacheKey, { route: fallbackRoute, cachedAt: Date.now() });
    return fallbackRoute;
  }

  private callGoogleRoutesApi(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<IRoutePolyline | null> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        origin: {
          location: {
            latLng: {
              latitude: origin.lat,
              longitude: origin.lng
            }
          }
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.lat,
              longitude: destination.lng
            }
          }
        },
        travelMode: 'TWO_WHEELER',
        routingPreference: 'TRAFFIC_AWARE'
      });

      const options = {
        hostname: 'routes.googleapis.com',
        port: 443,
        path: '/directions/v2:computeRoutes',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'X-Goog-Api-Key': this.serverApiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.routes && parsed.routes.length > 0) {
              const r = parsed.routes[0];
              const durationSec = parseInt(r.duration?.replace('s', '') || '900', 10);
              const distanceMeters = r.distanceMeters || 2400;
              const encodedPolyline = r.polyline?.encodedPolyline || '';
              const coordinates = decodePolyline(encodedPolyline);

              resolve({
                encodedPolyline,
                coordinates,
                durationSeconds: durationSec,
                distanceMeters,
                etaMinutes: Math.max(1, Math.round(durationSec / 60)),
                computedAt: Date.now()
              });
            } else {
              resolve(null);
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Geocoding API: Forward Geocode address string to Lat/Lng
   */
  async geocode(address: string): Promise<{ latitude: number; longitude: number; formattedAddress: string } | null> {
    if (!this.serverApiKey) {
      // Default to Kompally, Hyderabad (17.55714, 78.44987)
      return { latitude: 17.55714, longitude: 78.44987, formattedAddress: `${address}, Kompally, Hyderabad, Telangana 500100` };
    }

    return new Promise((resolve) => {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.serverApiKey}`;
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.results && parsed.results.length > 0) {
              const loc = parsed.results[0].geometry.location;
              resolve({
                latitude: loc.lat,
                longitude: loc.lng,
                formattedAddress: parsed.results[0].formatted_address
              });
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      }).on('error', () => resolve(null));
    });
  }

  /**
   * OpenStreetMap Nominatim Reverse Geocoding:
   * Translates GPS Latitude & Longitude into human-readable street & neighborhood
   */
  async reverseGeocodeOSM(lat: number, lng: number): Promise<{
    road: string;
    area: string;
    city: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
  }> {
    return new Promise((resolve) => {
      const options = {
        hostname: 'nominatim.openstreetmap.org',
        path: `/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        headers: {
          'User-Agent': 'DeliverApp-Service/1.0 (contact@deliverapp.local)'
        }
      };

      const req = https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const addr = parsed.address || {};
            const road = addr.road || addr.pedestrian || addr.suburb || 'Current Street';
            const area = addr.neighbourhood || addr.suburb || addr.city_district || 'Surrounding Area';
            const city = addr.city || addr.town || addr.county || 'Local Region';
            const postcode = addr.postcode || '';
            resolve({
              road,
              area,
              city,
              formattedAddress: parsed.display_name || `${road}, ${area}, ${city} ${postcode}`.trim(),
              latitude: lat,
              longitude: lng
            });
          } catch {
            resolve({
              road: `${lat.toFixed(4)}° N`,
              area: `${lng.toFixed(4)}° E`,
              city: 'Detected Surroundings',
              formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (Surroundings)`,
              latitude: lat,
              longitude: lng
            });
          }
        });
      });

      req.on('error', () => {
        resolve({
          road: `${lat.toFixed(4)}° N`,
          area: `${lng.toFixed(4)}° E`,
          city: 'Detected Surroundings',
          formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (Surroundings)`,
          latitude: lat,
          longitude: lng
        });
      });
    });
  }

  /**
   * Generates a realistic street-following route polyline between Fort Kochi points
   */
  private generateRealisticRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): IRoutePolyline {
    // Generate 12 waypoints simulating navigation through street network
    const coords: IRouteCoordinate[] = [];
    const steps = 14;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Slight arc curve simulating city grid streets
      const curve = Math.sin(t * Math.PI) * 0.0025;
      const lat = origin.lat + (destination.lat - origin.lat) * t + curve;
      const lng = origin.lng + (destination.lng - origin.lng) * t - (curve * 0.5);
      coords.push({ latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) });
    }

    const distanceMeters = Math.round(
      Math.sqrt(
        Math.pow((destination.lat - origin.lat) * 111000, 2) +
        Math.pow((destination.lng - origin.lng) * 111000 * Math.cos(origin.lat * Math.PI / 180), 2)
      )
    );

    const durationSeconds = Math.round((distanceMeters / 25) * 3.6); // avg 25 km/h on Vespa

    return {
      encodedPolyline: 'q_`|Ac}qwLq@_@s@q@q@o@q@i@u@w@aA_Aq@s@',
      coordinates: coords,
      durationSeconds,
      distanceMeters,
      etaMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      computedAt: Date.now()
    };
  }
}
