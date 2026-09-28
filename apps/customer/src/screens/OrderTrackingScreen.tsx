import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Easing 
} from 'react-native';
import { IOrder, OrderStatus, IRiderLocation, IRoutePolyline } from '@deliverapp/types';
import { fetchLiveTrackingState, subscribeToOrderTracking } from '../services/api';

interface OrderTrackingScreenProps {
  initialOrder: IOrder;
  onDone: () => void;
}

const STATE_STEPS: { status: OrderStatus; label: string; icon: string; description: string }[] = [
  { status: OrderStatus.PLACED, label: 'Order Placed', icon: '📝', description: 'Ticket received & queued' },
  { status: OrderStatus.ACCEPTED, label: 'Kitchen Confirmed', icon: '👨‍🍳', description: 'Chef reviewed & acknowledged' },
  { status: OrderStatus.PREPARING, label: 'In Woodfired Oven', icon: '🔥', description: 'Baking at 450°C' },
  { status: OrderStatus.READY_FOR_PICKUP, label: 'Ready at Pass', icon: '📦', description: 'Boxed in thermo-insulated pack' },
  { status: OrderStatus.PICKED_UP, label: 'Courier Collected', icon: '🛵', description: 'Julian K. secured the package' },
  { status: OrderStatus.OUT_FOR_DELIVERY, label: 'Out for Delivery', icon: '⚡', description: 'En route on Electric Vespa' },
  { status: OrderStatus.DELIVERED, label: 'Delivered', icon: '🎉', description: 'Enjoy your artisan meal!' },
];

export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({
  initialOrder,
  onDone,
}) => {
  const [order, setOrder] = useState<IOrder>(initialOrder);
  const [riderLocation, setRiderLocation] = useState<IRiderLocation | null>(null);
  const [route, setRoute] = useState<IRoutePolyline | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [lastPingTime, setLastPingTime] = useState<string>('Just now');
  const [autoFitCamera, setAutoFitCamera] = useState<boolean>(true);

  // Animated values for gliding position and rotation
  const animX = useRef(new Animated.Value(0.5)).current;
  const animY = useRef(new Animated.Value(0.5)).current;
  const animRotate = useRef(new Animated.Value(45)).current;
  const lastUpdateRef = useRef<number>(Date.now());

  // Load tracking state on mount & on reconnect
  const loadTracking = async () => {
    try {
      const state = await fetchLiveTrackingState(order.id);
      if (state.riderLocation) {
        animateMarkerTo(state.riderLocation.latitude, state.riderLocation.longitude, state.riderLocation.heading || 45);
        setRiderLocation(state.riderLocation);
      }
      if (state.route) {
        setRoute(state.route);
      }
      setIsStale(state.isStale);
    } catch {
      // Offline or network lag
    }
  };

  useEffect(() => {
    loadTracking();

    // Subscribe to real-time order status and hot rider GPS location telemetry
    const unsubscribe = subscribeToOrderTracking(order.id, (event) => {
      lastUpdateRef.current = Date.now();
      setIsStale(false);

      if (event.event === 'order:status_changed') {
        setOrder(prev => ({
          ...prev,
          status: event.data.status,
          updatedAt: event.data.updatedAt,
          auditLogs: [...prev.auditLogs, event.data.auditLog]
        }));
      } else if (event.event === 'order:rider_location' || event.event === 'rider:location_stream') {
        const loc: IRiderLocation = event.data.location;
        setRiderLocation(loc);
        setLastPingTime(new Date().toLocaleTimeString());

        // Gliding interpolation animation between updates
        animateMarkerTo(loc.latitude, loc.longitude, loc.heading || 45);
      }
    });

    // Check for stale location (> 30s) every 5 seconds
    const staleInterval = setInterval(() => {
      if (Date.now() - lastUpdateRef.current > 30_000) {
        setIsStale(true);
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(staleInterval);
    };
  }, [order.id]);

  const animateMarkerTo = (lat: number, lng: number, heading: number) => {
    // Normalize coordinates relative to bounding box
    const minLat = 9.9250;
    const maxLat = 9.9380;
    const minLng = 76.2580;
    const maxLng = 76.2730;

    const normX = Math.max(0.05, Math.min(0.95, (lng - minLng) / (maxLng - minLng)));
    const normY = Math.max(0.05, Math.min(0.95, 1 - ((lat - minLat) / (maxLat - minLat))));

    Animated.parallel([
      Animated.timing(animX, {
        toValue: normX,
        duration: 2400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(animY, {
        toValue: normY,
        duration: 2400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(animRotate, {
        toValue: heading,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const currentStepIndex = STATE_STEPS.findIndex(s => s.status === order.status);

  const rotateInterpolate = animRotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onDone}>
          <Text style={styles.closeBtn}>✕ Close</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.id}</Text>
        <View style={styles.liveIndicator}>
          <View style={[styles.liveDot, { backgroundColor: isStale ? '#f59e0b' : '#10b981' }]} />
          <Text style={[styles.liveText, { color: isStale ? '#f59e0b' : '#10b981' }]}>
            {isStale ? 'SEARCHING' : 'LIVE GPS'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Estimated Arrival Banner */}
        <View style={styles.etaCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.etaSub}>ESTIMATED ARRIVAL</Text>
            {route && (
              <Text style={styles.distanceBadge}>
                {(route.distanceMeters / 1000).toFixed(1)} km away
              </Text>
            )}
          </View>
          <Text style={styles.etaTime}>
            {order.status === OrderStatus.DELIVERED ? 'Delivered 🎉' : `${route?.etaMinutes || 18} Minutes`}
          </Text>
          <Text style={styles.etaRestaurant}>
            Julian is navigating Napier Street on Electric Vespa to {order.deliveryAddress?.label || 'Your Location'}
          </Text>

          {/* Stale location alert */}
          {isStale && order.status !== OrderStatus.DELIVERED && (
            <View style={styles.staleNotice}>
              <Text style={styles.staleIcon}>⚠️</Text>
              <Text style={styles.staleText}>
                Rider is not sharing location right now (network buffer). Reconnecting automatically...
              </Text>
            </View>
          )}
        </View>

        {/* Live Interactive Map with Animated Gliding Rider & Polyline */}
        <View style={styles.mapContainer}>
          {/* Map Canvas */}
          <View style={styles.mapGraphic}>
            {/* Background Grid & Streets */}
            <View style={styles.gridLineHorizontal} />
            <View style={styles.gridLineVertical} />

            {/* Restaurant Pin */}
            <View style={[styles.mapMarker, { top: 30, right: 40 }]}>
              <Text style={styles.markerEmoji}>🍕</Text>
              <Text style={styles.markerLabel}>Forno d&apos;Oro</Text>
            </View>

            {/* Delivery Destination Pin */}
            <View style={[styles.mapMarker, { bottom: 30, left: 40 }]}>
              <Text style={styles.markerEmoji}>📍</Text>
              <Text style={styles.markerLabel}>42 Artisan Row</Text>
            </View>

            {/* Animated Gliding Rider Marker */}
            <Animated.View
              style={[
                styles.riderMarkerGlider,
                {
                  left: animX.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['10%', '85%'],
                  }),
                  top: animY.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['10%', '85%'],
                  }),
                  transform: [{ rotate: rotateInterpolate }],
                },
              ]}
            >
              <View style={styles.radarRing} />
              <Text style={{ fontSize: 24 }}>🛵</Text>
            </Animated.View>
          </View>

          {/* Map Controls: Recenter Camera */}
          <View style={styles.mapControlsOverlay}>
            <TouchableOpacity
              style={[styles.recenterBtn, autoFitCamera && styles.recenterBtnActive]}
              onPress={() => {
                setAutoFitCamera(true);
                if (riderLocation) {
                  animateMarkerTo(riderLocation.latitude, riderLocation.longitude, riderLocation.heading || 45);
                }
              }}
            >
              <Text style={styles.recenterText}>🎯 Recenter</Text>
            </TouchableOpacity>

            <View style={styles.speedPill}>
              <Text style={styles.speedValue}>
                {riderLocation?.speed ? `${riderLocation.speed} km/h` : '28 km/h'}
              </Text>
            </View>
          </View>
        </View>

        {/* Courier Details Card */}
        <View style={styles.riderCard}>
          <View style={styles.riderHeader}>
            <View style={styles.riderAvatar}>
              <Text style={{ fontSize: 24 }}>🛵</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.rowBetween}>
                <Text style={styles.riderName}>Julian K.</Text>
                <Text style={styles.riderRating}>★ 4.9 (2.4k+)</Text>
              </View>
              <Text style={styles.riderVehicle}>Electric Vespa • KL-07-CK-4290</Text>
            </View>
          </View>

          {/* Telemetry metadata */}
          <View style={styles.telemetrySection}>
            <View style={styles.rowBetween}>
              <Text style={styles.telemetryTitle}>HOT LOCATION STREAM (3-5s BATCHED)</Text>
              <Text style={styles.pingTime}>{lastPingTime}</Text>
            </View>
            <View style={styles.coordsRow}>
              <Text style={styles.coordText}>
                LAT: {riderLocation ? riderLocation.latitude.toFixed(4) : '9.9325° N'}
              </Text>
              <Text style={styles.coordText}>
                LNG: {riderLocation ? riderLocation.longitude.toFixed(4) : '76.2685° E'}
              </Text>
              <Text style={styles.headingText}>
                HEAD: {riderLocation?.heading ? `${riderLocation.heading}°` : '45°'}
              </Text>
            </View>
          </View>
        </View>

        {/* State Machine Stepper */}
        <View style={styles.stepperCard}>
          <Text style={styles.sectionHeader}>ORDER STATUS PROGRESSION</Text>
          <View style={styles.stepperContainer}>
            {STATE_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <View key={step.status} style={styles.stepItem}>
                  <View style={styles.stepIndicatorCol}>
                    <View
                      style={[
                        styles.stepDot,
                        isPast && styles.stepDotDone,
                        isCurrent && styles.stepDotCurrent,
                      ]}
                    >
                      <Text style={styles.stepIcon}>{step.icon}</Text>
                    </View>
                    {idx < STATE_STEPS.length - 1 && (
                      <View
                        style={[
                          styles.stepConnector,
                          isPast && styles.stepConnectorDone,
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.stepContent}>
                    <Text
                      style={[
                        styles.stepTitle,
                        isCurrent && styles.stepTitleCurrent,
                        isPast && styles.stepTitleDone,
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text style={styles.stepDesc}>{step.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Audit Log Timeline */}
        <View style={styles.auditCard}>
          <Text style={styles.sectionHeader}>IMMUTABLE AUDIT TRAIL</Text>
          {order.auditLogs.map((log, i) => (
            <View key={log.id || i} style={styles.auditRow}>
              <View style={styles.auditActorBadge}>
                <Text style={styles.auditActorText}>{log.changedBy}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.auditReason}>{log.reason || 'Status transition'}</Text>
                <Text style={styles.auditTime}>
                  {new Date(log.timestamp).toLocaleTimeString()} • State: {log.newStatus}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0a09' },
  topBar: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1c1917',
  },
  closeBtn: { color: '#a8a29e', fontSize: 13, fontWeight: '700' },
  headerTitle: { color: '#fafaf9', fontSize: 16, fontWeight: '700' },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1917',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#292524',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  liveText: { fontSize: 10, fontWeight: '800' },
  scrollContent: { padding: 16, paddingBottom: 60 },
  etaCard: {
    backgroundColor: '#1c1917',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#292524',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  etaSub: { color: '#f59e0b', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  distanceBadge: { color: '#10b981', fontSize: 11, fontWeight: '700' },
  etaTime: { color: '#fafaf9', fontSize: 32, fontWeight: '800', marginVertical: 4 },
  etaRestaurant: { color: '#a8a29e', fontSize: 12 },
  staleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  staleIcon: { fontSize: 14, marginRight: 8 },
  staleText: { color: '#f59e0b', fontSize: 11, flex: 1, fontWeight: '500' },
  mapContainer: {
    backgroundColor: '#141210',
    borderRadius: 16,
    height: 240,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#292524',
    position: 'relative',
  },
  mapGraphic: { flex: 1, position: 'relative' },
  gridLineHorizontal: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#292524',
  },
  gridLineVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#292524',
  },
  mapMarker: { position: 'absolute', alignItems: 'center' },
  markerEmoji: { fontSize: 24 },
  markerLabel: {
    backgroundColor: '#0c0a09',
    color: '#fafaf9',
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#292524',
  },
  riderMarkerGlider: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    opacity: 0.4,
  },
  mapControlsOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recenterBtn: {
    backgroundColor: 'rgba(28, 25, 23, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  recenterBtnActive: { borderColor: '#f59e0b' },
  recenterText: { color: '#fafaf9', fontSize: 11, fontWeight: '700' },
  speedPill: {
    backgroundColor: 'rgba(12, 10, 9, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#292524',
  },
  speedValue: { color: '#f59e0b', fontSize: 11, fontWeight: '800', fontFamily: 'monospace' },
  riderCard: {
    backgroundColor: '#1c1917',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#292524',
  },
  riderHeader: { flexDirection: 'row', alignItems: 'center' },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#292524',
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderName: { color: '#fafaf9', fontSize: 16, fontWeight: '700' },
  riderRating: { color: '#f59e0b', fontSize: 12, fontWeight: '700' },
  riderVehicle: { color: '#a8a29e', fontSize: 12, marginTop: 2 },
  telemetrySection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#292524',
  },
  telemetryTitle: { color: '#78716c', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  pingTime: { color: '#10b981', fontSize: 10, fontWeight: '600' },
  coordsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  coordText: { color: '#a8a29e', fontSize: 11, fontFamily: 'monospace' },
  headingText: { color: '#f59e0b', fontSize: 11, fontFamily: 'monospace' },
  stepperCard: {
    backgroundColor: '#1c1917',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#292524',
  },
  sectionHeader: { color: '#78716c', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  stepperContainer: { spaceY: 10 },
  stepItem: { flexDirection: 'row', marginBottom: 12 },
  stepIndicatorCol: { alignItems: 'center', width: 36 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#292524',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotCurrent: { backgroundColor: '#f59e0b' },
  stepDotDone: { backgroundColor: '#10b981' },
  stepIcon: { fontSize: 12 },
  stepConnector: { width: 2, height: 26, backgroundColor: '#292524', marginVertical: 2 },
  stepConnectorDone: { backgroundColor: '#10b981' },
  stepContent: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  stepTitle: { color: '#78716c', fontSize: 13, fontWeight: '600' },
  stepTitleCurrent: { color: '#f59e0b', fontWeight: '800', fontSize: 14 },
  stepTitleDone: { color: '#fafaf9', fontWeight: '600' },
  stepDesc: { color: '#78716c', fontSize: 11, marginTop: 1 },
  auditCard: {
    backgroundColor: '#1c1917',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#292524',
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#292524',
  },
  auditActorBadge: {
    backgroundColor: '#292524',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 70,
    alignItems: 'center',
  },
  auditActorText: { color: '#f59e0b', fontSize: 9, fontWeight: '800' },
  auditReason: { color: '#e7e5e4', fontSize: 12, fontWeight: '500' },
  auditTime: { color: '#78716c', fontSize: 10, marginTop: 2 },
});
