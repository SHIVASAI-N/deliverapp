import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { IRider, IOrder, OrderStatus } from '@deliverapp/types';
import { RiderTelemetryService } from '../services/telemetryService';
import { fetchRiderProfile, updateDeliveryStatus } from '../services/api';
import { DeliveryNavigationScreen } from './DeliveryNavigationScreen';

const telemetry = new RiderTelemetryService('rider_julian');

export const RiderHomeScreen: React.FC = () => {
  const [rider, setRider] = useState<IRider | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showNavigation, setShowNavigation] = useState(false);
  const [activeOrder, setActiveOrder] = useState<IOrder | null>({
    id: 'EP-9156',
    customerId: 'usr_aarav',
    customerName: 'Aarav Mehta',
    customerPhone: '+919847088990',
    restaurantId: 'rest_forno_doro',
    restaurantName: "Forno d'Oro Trattoria",
    items: [
      {
        menuItemId: 'item_burrata_pugliese',
        name: 'Burrata Pugliese Pizza',
        unitPrice: 549,
        quantity: 2,
        selectedOptions: [],
        totalPrice: 1098
      }
    ],
    bill: {
      subtotal: 1098,
      tax: 55,
      deliveryFee: 0,
      riderTip: 50,
      discount: 149,
      couponCode: 'EPICURE20',
      total: 1054
    },
    deliveryAddress: {
      label: '42 Artisan Row, Apt 4B',
      street: 'Napier Street, Heritage Quarters',
      area: 'Fort Kochi',
      city: 'Kochi, Kerala',
      latitude: 9.9275,
      longitude: 76.2600
    },
    status: OrderStatus.READY_FOR_PICKUP,
    paymentId: 'pay_rzp_mock',
    paymentMode: 'RAZORPAY',
    estimatedDeliveryMinutes: 22,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    auditLogs: []
  });

  const [loadingAction, setLoadingAction] = useState(false);
  const [coords, setCoords] = useState(telemetry.getCurrentCoordinates());

  useEffect(() => {
    fetchRiderProfile('rider_julian')
      .then(data => setRider(data))
      .catch(() => {});

    if (isOnline) {
      telemetry.setActiveOrder(activeOrder?.id || null);
      telemetry.startBatchTelemetry(3);
    } else {
      telemetry.stopBatchTelemetry();
    }

    const interval = setInterval(() => {
      setCoords(telemetry.getCurrentCoordinates());
    }, 3000);

    return () => {
      clearInterval(interval);
      telemetry.stopBatchTelemetry();
    };
  }, [isOnline, activeOrder?.id]);

  if (showNavigation && activeOrder) {
    return (
      <DeliveryNavigationScreen
        order={activeOrder}
        telemetry={telemetry}
        onBack={() => setShowNavigation(false)}
        onStatusChanged={(updated) => setActiveOrder(updated)}
      />
    );
  }

  const handleStatusTransition = async (next: OrderStatus, reason: string) => {
    if (!activeOrder) return;
    try {
      setLoadingAction(true);
      const updated = await updateDeliveryStatus(activeOrder.id, next, reason);
      setActiveOrder(updated);
      Alert.alert('Status Updated', `Order state transitioned to ${next}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Transition failed');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar with Online Toggle */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.appTitle}>COURIER OS</Text>
          <Text style={styles.riderName}>{rider?.name || 'Julian K.'}</Text>
        </View>

        <TouchableOpacity
          style={[styles.dutyToggle, isOnline ? styles.dutyOnline : styles.dutyOffline]}
          onPress={() => setIsOnline(!isOnline)}
        >
          <View style={[styles.dutyDot, { backgroundColor: isOnline ? '#10b981' : '#78716c' }]} />
          <Text style={[styles.dutyText, { color: isOnline ? '#10b981' : '#78716c' }]}>
            {isOnline ? 'ON DUTY' : 'OFFLINE'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Rider Vehicle & Rating Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarPill}>
              <Text style={{ fontSize: 24 }}>🛵</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.vehicleTitle}>{rider?.vehicleType || 'Electric Vespa'}</Text>
              <Text style={styles.vehiclePlate}>{rider?.vehiclePlate || 'KL-07-CK-4290'}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>★ 4.9</Text>
              <Text style={styles.tripsText}>2,420 trips</Text>
            </View>
          </View>

          {/* Earnings & Shifts Grid */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>TODAY&apos;S EARNINGS</Text>
              <Text style={styles.metricValue}>₹1,850</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>DELIVERIES</Text>
              <Text style={styles.metricValue}>11</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>ACTIVE HOURS</Text>
              <Text style={styles.metricValue}>4.2h</Text>
            </View>
          </View>
        </View>

        {/* Live GPS Telemetry Beacon */}
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <View style={styles.pulseBeacon}>
              <View style={styles.pulseDot} />
            </View>
            <Text style={styles.telemetryHeading}>BATCHING GPS TELEMETRY (3-5s INTERVALS)</Text>
          </View>
          <Text style={styles.telemetrySub}>
            Streaming coordinates to backend Redis Hot Layer without SQL load
          </Text>
          <View style={styles.coordsGrid}>
            <Text style={styles.coordValue}>Lat: {coords.latitude.toFixed(5)}</Text>
            <Text style={styles.coordValue}>Lng: {coords.longitude.toFixed(5)}</Text>
            <Text style={styles.coordValue}>Speed: {coords.speed} km/h</Text>
            <Text style={styles.coordValue}>Heading: {coords.heading}°</Text>
          </View>
        </View>

        {/* Active Dispatched Job */}
        {activeOrder ? (
          <View style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <View>
                <Text style={styles.jobSub}>ACTIVE DISPATCHED JOB</Text>
                <Text style={styles.jobOrderId}>Order #{activeOrder.id}</Text>
              </View>
              <View style={styles.jobStatusPill}>
                <Text style={styles.jobStatusText}>{activeOrder.status}</Text>
              </View>
            </View>

            {/* Pickup Point */}
            <View style={styles.stopCard}>
              <Text style={styles.stopType}>1. RESTAURANT PICKUP</Text>
              <Text style={styles.stopName}>{activeOrder.restaurantName}</Text>
              <Text style={styles.stopAddress}>Heritage Quarters, Fort Kochi</Text>
              <Text style={styles.stopInstruction}>
                Boxed in thermo-insulated pack at kitchen pass
              </Text>
            </View>

            {/* Dropoff Point */}
            <View style={styles.stopCard}>
              <Text style={styles.stopType}>2. CUSTOMER DROPOFF</Text>
              <Text style={styles.stopName}>{activeOrder.customerName} ({activeOrder.customerPhone})</Text>
              <Text style={styles.stopAddress}>
                {activeOrder.deliveryAddress?.street}, {activeOrder.deliveryAddress?.area}
              </Text>
              <Text style={styles.stopInstruction}>
                Notes: Ring bell twice, leave with concierge
              </Text>
            </View>

            {/* GPS Turn-by-Turn Route Preview Launcher */}
            <TouchableOpacity
              style={styles.navButtonPill}
              onPress={() => setShowNavigation(true)}
            >
              <Text style={styles.navButtonText}>🗺️ View Turn-by-Turn GPS Map →</Text>
            </TouchableOpacity>

            {/* State Transition Action Controls */}
            <View style={styles.actionsContainer}>
              {activeOrder.status === OrderStatus.READY_FOR_PICKUP && (
                <TouchableOpacity
                  disabled={loadingAction}
                  style={styles.actionBtnPrimary}
                  onPress={() => handleStatusTransition(OrderStatus.PICKED_UP, 'Courier collected order from restaurant')}
                >
                  {loadingAction ? <ActivityIndicator color="#0c0a09" /> : (
                    <Text style={styles.actionBtnText}>Confirm Order Pickup 📦</Text>
                  )}
                </TouchableOpacity>
              )}

              {activeOrder.status === OrderStatus.PICKED_UP && (
                <TouchableOpacity
                  disabled={loadingAction}
                  style={[styles.actionBtnPrimary, { backgroundColor: '#f97316' }]}
                  onPress={() => handleStatusTransition(OrderStatus.OUT_FOR_DELIVERY, 'Departed on Electric Vespa')}
                >
                  {loadingAction ? <ActivityIndicator color="#0c0a09" /> : (
                    <Text style={styles.actionBtnText}>Start Journey to Doorstep 🛵</Text>
                  )}
                </TouchableOpacity>
              )}

              {activeOrder.status === OrderStatus.OUT_FOR_DELIVERY && (
                <TouchableOpacity
                  disabled={loadingAction}
                  style={[styles.actionBtnPrimary, { backgroundColor: '#10b981' }]}
                  onPress={() => handleStatusTransition(OrderStatus.DELIVERED, 'Order successfully handed over to customer')}
                >
                  {loadingAction ? <ActivityIndicator color="#0c0a09" /> : (
                    <Text style={styles.actionBtnText}>Mark Order Delivered 🎉</Text>
                  )}
                </TouchableOpacity>
              )}

              {activeOrder.status === OrderStatus.DELIVERED && (
                <View style={styles.deliveredCompleteCard}>
                  <Text style={styles.completeTitle}>✓ Delivery Completed</Text>
                  <Text style={styles.completeSub}>Payout credited: ₹99 (Delivery fee + ₹50 Tip)</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noJobCard}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>📡</Text>
            <Text style={styles.noJobTitle}>Searching for Nearby Orders...</Text>
            <Text style={styles.noJobSub}>You are in prime zone: Fort Kochi Heritage Quarters.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0a09' },
  topBar: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1c1917',
  },
  appTitle: { color: '#78716c', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  riderName: { color: '#fafaf9', fontSize: 18, fontWeight: '800' },
  dutyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  dutyOnline: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' },
  dutyOffline: { backgroundColor: '#1c1917', borderColor: '#292524' },
  dutyDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  dutyText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  scrollContent: { padding: 16, paddingBottom: 60 },
  profileCard: {
    backgroundColor: '#1c1917',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#292524',
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarPill: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#292524', justifyContent: 'center', alignItems: 'center' },
  vehicleTitle: { color: '#fafaf9', fontSize: 15, fontWeight: '700' },
  vehiclePlate: { color: '#a8a29e', fontSize: 12, fontFamily: 'monospace' },
  ratingBadge: { alignItems: 'flex-end' },
  ratingText: { color: '#f59e0b', fontSize: 13, fontWeight: '800' },
  tripsText: { color: '#78716c', fontSize: 10 },
  metricsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#292524',
    justifyContent: 'space-between',
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricLabel: { color: '#78716c', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  metricValue: { color: '#fafaf9', fontSize: 16, fontWeight: '800', marginTop: 2 },
  metricDivider: { width: 1, height: 24, backgroundColor: '#292524' },
  telemetryCard: {
    backgroundColor: '#141210',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#292524',
  },
  telemetryHeader: { flexDirection: 'row', alignItems: 'center' },
  pulseBeacon: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(16, 185, 129, 0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  telemetryHeading: { color: '#10b981', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  telemetrySub: { color: '#78716c', fontSize: 11, marginTop: 2 },
  coordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#292524',
  },
  coordValue: { color: '#a8a29e', fontSize: 11, fontFamily: 'monospace', width: '48%', marginVertical: 2 },
  jobCard: {
    backgroundColor: '#1c1917',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  jobSub: { color: '#f59e0b', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  jobOrderId: { color: '#fafaf9', fontSize: 18, fontWeight: '800', marginTop: 2 },
  jobStatusPill: { backgroundColor: '#292524', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  jobStatusText: { color: '#f59e0b', fontSize: 11, fontWeight: '700' },
  stopCard: {
    backgroundColor: '#0c0a09',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#292524',
  },
  stopType: { color: '#78716c', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  stopName: { color: '#fafaf9', fontSize: 14, fontWeight: '700', marginTop: 2 },
  stopAddress: { color: '#a8a29e', fontSize: 12, marginTop: 2 },
  stopInstruction: { color: '#f59e0b', fontSize: 11, fontStyle: 'italic', marginTop: 4 },
  navButtonPill: {
    backgroundColor: '#292524',
    borderWidth: 1,
    borderColor: '#44403c',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  navButtonText: { color: '#f59e0b', fontSize: 12, fontWeight: '700' },
  actionsContainer: { marginTop: 14 },
  actionBtnPrimary: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnText: { color: '#0c0a09', fontSize: 14, fontWeight: '800' },
  deliveredCompleteCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  completeTitle: { color: '#10b981', fontSize: 14, fontWeight: '800' },
  completeSub: { color: '#a8a29e', fontSize: 12, marginTop: 4 },
  noJobCard: {
    backgroundColor: '#1c1917',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#292524',
  },
  noJobTitle: { color: '#fafaf9', fontSize: 16, fontWeight: '700' },
  noJobSub: { color: '#78716c', fontSize: 12, textAlign: 'center', marginTop: 4 },
});
