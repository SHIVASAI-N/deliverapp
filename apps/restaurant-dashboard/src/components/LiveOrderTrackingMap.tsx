'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { IOrder, IRiderLocation, IRoutePolyline } from '@deliverapp/types';

interface LiveOrderTrackingMapProps {
  order: IOrder;
  onClose: () => void;
}

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_WEB_KEY || '';

export const LiveOrderTrackingMap: React.FC<LiveOrderTrackingMapProps> = ({ order, onClose }) => {
  const [provider, setProvider] = useState<'osm' | 'google'>('osm');
  const [riderLocation, setRiderLocation] = useState<IRiderLocation | null>(null);
  const [route, setRoute] = useState<IRoutePolyline | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [lastPingTime, setLastPingTime] = useState<string>('Connecting...');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('Default Surroundings');

  const osmContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const initialCustomerPos = {
    lat: order.deliveryAddress?.latitude || 9.9275,
    lng: order.deliveryAddress?.longitude || 76.2600
  };

  const activeCustomerPos = currentCoords || initialCustomerPos;
  const restaurantPos = {
    lat: activeCustomerPos.lat + 0.0075,
    lng: activeCustomerPos.lng + 0.0090
  };

  const loadTrackingData = useCallback(async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/v1/orders/${order.id}/tracking`);
      if (res.ok) {
        const data = await res.json();
        if (data.riderLocation) {
          setRiderLocation(data.riderLocation);
          setLastPingTime(new Date(data.riderLocation.timestamp).toLocaleTimeString());
        }
        if (data.route) {
          setRoute(data.route);
        }
        setIsStale(data.isStale);
      }
    } catch (e) {
      console.warn('Failed to load tracking data', e);
    }
  }, [order.id]);

  // Request browser current location
  const detectLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setLocationStatus('Locating GPS...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentCoords({ lat, lng });
          setLocationStatus('GPS Locked & Surrounding Active');
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15);
          }
        },
        (err) => {
          console.warn('Geolocation failed:', err.message);
          setLocationStatus('GPS Unavailable (Using Heritage Default)');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  // Mount OpenStreetMap Leaflet layer when provider === 'osm'
  useEffect(() => {
    if (provider !== 'osm') return;

    // Dynamically inject Leaflet CSS & JS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initOSM = () => {
      const L = (window as any).L;
      if (!L || !osmContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const center = activeCustomerPos;
      const map = L.map(osmContainerRef.current, {
        zoomControl: false,
        attributionControl: true
      }).setView([center.lat, center.lng], 15);
      mapInstanceRef.current = map;

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // 1.2 km Surrounding Radius Delivery Zone
      L.circle([center.lat, center.lng], {
        radius: 1200,
        color: '#a83211',
        weight: 1.5,
        dashArray: '6, 8',
        fillColor: '#a83211',
        fillOpacity: 0.08
      }).addTo(map);

      // Customer Marker
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div style="background:#006b2c; color:#fff; width:28px; height:28px; border-radius:50%; border:3px solid #fff; box-shadow:0 3px 8px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; font-size:12px;">📍</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      L.marker([center.lat, center.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`<b>📍 Delivery Destination</b><br/>Surrounding Area Active`);

      // Restaurant Marker
      const restIcon = L.divIcon({
        className: 'rest-marker',
        html: `<div style="background:#835500; color:#fff; width:28px; height:28px; border-radius:50%; border:2px solid #fff; box-shadow:0 3px 8px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; font-size:14px;">🍕</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      L.marker([restaurantPos.lat, restaurantPos.lng], { icon: restIcon })
        .addTo(map)
        .bindPopup("<b>🍕 Forno d'Oro Trattoria</b>");

      // Courier Marker
      const courierLat = riderLocation ? riderLocation.latitude : (center.lat + restaurantPos.lat) / 2;
      const courierLng = riderLocation ? riderLocation.longitude : (center.lng + restaurantPos.lng) / 2;
      const riderIcon = L.divIcon({
        className: 'rider-marker',
        html: `<div style="background:#a83211; color:#fff; width:32px; height:32px; border-radius:50%; border:2.5px solid #fff; box-shadow:0 4px 10px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; font-size:15px;">🛵</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker([courierLat, courierLng], { icon: riderIcon })
        .addTo(map)
        .bindPopup("<b>Julian K. (Courier)</b><br/>Electric Vespa");

      // Polyline Route
      L.polyline([
        [restaurantPos.lat, restaurantPos.lng],
        [courierLat + 0.001, courierLng - 0.001],
        [center.lat, center.lng]
      ], {
        color: '#a83211',
        weight: 4,
        dashArray: '8, 8'
      }).addTo(map);

      setTimeout(() => {
        try { map.invalidateSize(); } catch(e) {}
      }, 250);
    };

    if ((window as any).L) {
      initOSM();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initOSM;
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch(e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [provider, activeCustomerPos.lat, activeCustomerPos.lng, riderLocation]);

  useEffect(() => {
    loadTrackingData();

    // Subscribe to SSE live updates
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const es = new EventSource(`${backendUrl}/api/v1/events/stream?orderId=${order.id}`);

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.event === 'order:rider_location' || parsed.event === 'rider:location_stream') {
          const loc = parsed.data.location;
          setRiderLocation(loc);
          setLastPingTime(new Date().toLocaleTimeString());
          setIsStale(false);
        }
      } catch (err) {
        console.error('SSE tracking parse error', err);
      }
    };

    const staleCheck = setInterval(() => {
      if (riderLocation && (Date.now() - riderLocation.timestamp > 30000)) {
        setIsStale(true);
      }
    }, 5000);

    return () => {
      es.close();
      clearInterval(staleCheck);
    };
  }, [order.id, loadTrackingData, riderLocation]);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl">🗺️</span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-stone-100">Live Courier Radar: Order #{order.id}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-semibold">
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Destination: {order.deliveryAddress?.street || 'Artisan Row'}, {order.deliveryAddress?.area || 'Fort Kochi'} ({order.customerName})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Map Provider Selector */}
            <div className="flex items-center bg-stone-800 rounded-lg p-0.5 border border-stone-700 text-xs">
              <button
                onClick={() => setProvider('osm')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  provider === 'osm' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                🌐 OpenStreetMap
              </button>
              <button
                onClick={() => setProvider('google')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  provider === 'google' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                🗺️ Google Maps
              </button>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-stone-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${isStale ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              <span className={isStale ? 'text-amber-400' : 'text-emerald-400'}>
                {isStale ? 'Stale' : 'GPS Live'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-200 text-lg px-2 py-1 rounded-lg hover:bg-stone-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Map Viewport */}
        <div className="relative h-96 w-full bg-stone-950 overflow-hidden">
          {provider === 'osm' ? (
            /* OpenStreetMap Viewport */
            <div className="w-full h-full relative">
              <div ref={osmContainerRef} className="w-full h-full" />
              {/* Quick Surroundings / Detect Button */}
              <div className="absolute top-3 right-3 z-[1000] flex items-center space-x-2">
                <button
                  onClick={detectLocation}
                  className="bg-stone-900/90 hover:bg-stone-800 text-white border border-stone-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg backdrop-blur flex items-center space-x-1.5 transition-colors"
                >
                  <span className="text-emerald-400">📍</span>
                  <span>My Surroundings</span>
                </button>
              </div>
              <div className="absolute bottom-2 left-2 z-[1000] bg-stone-900/90 border border-stone-700 text-stone-300 text-[10px] px-2 py-0.5 rounded font-mono shadow">
                {locationStatus}
              </div>
            </div>
          ) : GOOGLE_MAPS_KEY ? (
            /* Google Maps Viewport */
            <APIProvider apiKey={GOOGLE_MAPS_KEY}>
              <Map
                mapId="DEMO_MAP_ID"
                defaultCenter={restaurantPos}
                defaultZoom={15}
                gestureHandling="greedy"
                disableDefaultUI={false}
                style={{ width: '100%', height: '100%' }}
                internalUsageAttributionIds={['gmp_git_agentskills_v1']}
              >
                <AdvancedMarker position={restaurantPos}>
                  <div className="bg-amber-500 text-stone-950 p-2 rounded-full shadow-lg border-2 border-white flex items-center justify-center font-bold text-sm">
                    🍕
                  </div>
                </AdvancedMarker>

                <AdvancedMarker position={activeCustomerPos}>
                  <div className="bg-emerald-500 text-white p-2 rounded-full shadow-lg border-2 border-white flex items-center justify-center font-bold text-sm">
                    📍
                  </div>
                </AdvancedMarker>

                {riderLocation && (
                  <AdvancedMarker position={{ lat: riderLocation.latitude, lng: riderLocation.longitude }}>
                    <div 
                      className="bg-primary text-white p-2.5 rounded-full shadow-2xl border-2 border-amber-400 flex items-center justify-center transition-all duration-1000 ease-out"
                      style={{ transform: `rotate(${riderLocation.heading || 0}deg)` }}
                    >
                      <span className="text-base">🛵</span>
                    </div>
                  </AdvancedMarker>
                )}
              </Map>
            </APIProvider>
          ) : (
            /* Vector Radar Fallback */
            <div className="w-full h-full bg-stone-950 relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#292524_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
              <div className="text-center p-6 bg-stone-900/80 border border-stone-800 rounded-xl max-w-sm backdrop-blur">
                <span className="text-3xl block mb-2">🌐</span>
                <h4 className="font-bold text-stone-100 text-sm">OpenStreetMap Active</h4>
                <p className="text-xs text-stone-400 mt-1">Switching to OSM tiles with surrounding 1.2km radius...</p>
                <button
                  onClick={() => setProvider('osm')}
                  className="mt-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold"
                >
                  Mount OpenStreetMap
                </button>
              </div>
            </div>
          )}

          {/* Stale Warning Overlay */}
          {isStale && (
            <div className="absolute top-3 left-3 bg-amber-950/90 border border-amber-600/50 text-amber-200 px-3 py-1.5 rounded-lg text-xs flex items-center space-x-2 backdrop-blur shadow-lg z-[1000]">
              <span>⚠️</span>
              <span>Rider is not sharing location right now (Last ping: {lastPingTime})</span>
            </div>
          )}
        </div>

        {/* Telemetry Details Footer */}
        <div className="p-4 bg-stone-850 border-t border-stone-800 grid grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-stone-500 block uppercase font-mono">Assigned Courier</span>
            <span className="font-bold text-stone-200 text-sm">Julian K.</span>
            <span className="text-stone-400 block">Electric Vespa • KL-07-CK-4290</span>
          </div>

          <div>
            <span className="text-stone-500 block uppercase font-mono">Surrounding Route ETA</span>
            <span className="font-bold text-amber-400 text-sm">{route?.etaMinutes || 12} Minutes</span>
            <span className="text-stone-400 block">{((route?.distanceMeters || 1800) / 1000).toFixed(1)} km remaining</span>
          </div>

          <div>
            <span className="text-stone-500 block uppercase font-mono">Destination GPS</span>
            <span className="font-mono text-stone-300">
              {activeCustomerPos.lat.toFixed(4)}, {activeCustomerPos.lng.toFixed(4)}
            </span>
            <span className="text-stone-500 block">{locationStatus}</span>
          </div>

          <div className="flex flex-col justify-center items-end">
            <button
              onClick={detectLocation}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
            >
              <span>📍</span>
              <span>Keep Surroundings</span>
            </button>
            <span className="text-[10px] text-stone-500 mt-1">Provider: {provider.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
