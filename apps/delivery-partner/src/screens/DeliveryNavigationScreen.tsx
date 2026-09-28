import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Linking, 
  Alert 
} from 'react-native';
import { IOrder, OrderStatus } from '@deliverapp/types';
import { RiderTelemetryService } from '../services/telemetryService';
import { updateDeliveryStatus } from '../services/api';

interface DeliveryNavigationProps {
  order: IOrder;
  telemetry: RiderTelemetryService;
  onBack: () => void;
  onStatusChanged: (order: IOrder) => void;
}

export const DeliveryNavigationScreen: React.FC<DeliveryNavigationProps> = ({
  order,
  telemetry,
  onBack,
  onStatusChanged
}) => {
  const [coords, setCoords] = useState(telemetry.getCurrentCoordinates());
  const [targetDestination, setTargetDestination] = useState<{
    label: string;
    address: string;
    lat: number;
    lng: number;
    instruction: string;
  }>({
    label: order.restaurantName,
    address: 'Heritage Quarters, Fort Kochi',
    lat: 9.9350,
    lng: 76.2710,
    instruction: 'Head north on Napier St toward Princess St. Collect thermo-boxed pizza.'
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Determine current navigation phase
    if (order.status === OrderStatus.READY_FOR_PICKUP) {
      setTargetDestination({
        label: `Pickup: ${order.restaurantName}`,
        address: 'Heritage Quarters, Fort Kochi',
        lat: 9.9350,
        lng: 76.2710,
        instruction: 'Arrive at kitchen pass, quote Order #' + order.id
      });
    } else {
      setTargetDestination({
        label: `Dropoff: ${order.customerName}`,
        address: `${order.deliveryAddress?.street}, ${order.deliveryAddress?.area}`,
        lat: order.deliveryAddress?.latitude || 9.9275,
        lng: order.deliveryAddress?.longitude || 76.2600,
        instruction: 'Ring bell twice, leave with concierge / patron'
      });
    }

    const interval = setInterval(() => {
      setCoords(telemetry.getCurrentCoordinates());
    }, 3000);

    return () => clearInterval(interval);
  }, [order.status, order.id, telemetry]);

  const handleOpenGoogleMaps = async () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${targetDestination.lat},${targetDestination.lng}&travelmode=two-wheeler`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://maps.google.com/?q=${targetDestination.lat},${targetDestination.lng}`);
      }
    } catch (err: any) {
      Alert.alert('Navigation Fallback', `Routing to coordinates: ${targetDestination.lat}, ${targetDestination.lng}`);
    }
  };

  const handleAdvanceStep = async () => {
    try {
      setLoading(true);
      if (order.status === OrderStatus.READY_FOR_PICKUP) {
        const updated = await updateDeliveryStatus(order.id, OrderStatus.PICKED_UP, 'Courier collected order from restaurant');
        onStatusChanged(updated);
      } else if (order.status === OrderStatus.PICKED_UP) {
        const updated = await updateDeliveryStatus(order.id, OrderStatus.OUT_FOR_DELIVERY, 'Departed on Electric Vespa');
        onStatusChanged(updated);
      } else if (order.status === OrderStatus.OUT_FOR_DELIVERY) {
        const updated = await updateDeliveryStatus(order.id, OrderStatus.DELIVERED, 'Order handed over to customer');
        telemetry.stopBatchTelemetry();
        onStatusChanged(updated);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Status transition failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtnText}>← Back to OS</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Delivery Route</Text>
        <View style={styles.statusPill}>
          <View style={[styles.dot, { backgroundColor: coords.isOnline ? '#10b981' : '#f59e0b' }]} />
          <Text style={styles.statusText}>{coords.isOnline ? 'GPS LIVE' : 'OFFLINE QUEUE'}</Text>
        </View>
      </View>

      {/* Turn-by-Turn Instruction Banner */}
      <View style={styles.instructionBanner}>
        <View style={styles.turnIconBox}>
          <Text style={{ fontSize: 24 }}>↰</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.distanceRemaining}>In 180 meters</Text>
          <Text style={styles.turnInstruction} numberOfLines={2}>
            {targetDestination.instruction}
          </Text>
        </View>
      </View>

      {/* Map Route Canvas */}
      <View style={styles.mapCanvas}>
        {/* Visual Road Simulation */}
        <View style={styles.roadLine} />
        
        {/* Origin/Rider Marker */}
        <View style={[styles.mapPin, { bottom: 60, left: 50 }]}>
          <View style={styles.riderPulse} />
          <Text style={{ fontSize: 28 }}>🛵</Text>
          <Text style={styles.pinLabel}>You ({coords.speed} km/h)</Text>
        </View>

        {/* Destination Marker */}
        <View style={[styles.mapPin, { top: 40, right: 60 }]}>
          <Text style={{ fontSize: 28 }}>
            {order.status === OrderStatus.READY_FOR_PICKUP ? '🍕' : '📍'}
          </Text>
          <Text style={styles.pinLabel}>{targetDestination.label}</Text>
        </View>

        {/* Google Maps External Fallback Button */}
        <TouchableOpacity style={styles.googleMapsFallbackBtn} onPress={handleOpenGoogleMaps}>
          <Text style={styles.googleMapsBtnText}>🗺️ Open Google Maps Navigation</Text>
        </TouchableOpacity>
      </View>

      {/* Delivery Target Details & Next Action */}
      <View style={styles.bottomCard}>
        <View style={styles.destinationHeader}>
          <View>
            <Text style={styles.destSub}>CURRENT TARGET</Text>
            <Text style={styles.destTitle}>{targetDestination.label}</Text>
            <Text style={styles.destAddr}>{targetDestination.address}</Text>
          </View>
          <View style={styles.etaBox}>
            <Text style={styles.etaNum}>7</Text>
            <Text style={styles.etaUnit}>MINS</Text>
          </View>
        </View>

        {coords.queueSize > 0 && (
          <Text style={styles.queueAlert}>
            ⚠️ Offline buffer: {coords.queueSize} location pings queued for sync
          </Text>
        )}

        <TouchableOpacity 
          disabled={loading} 
          style={styles.advanceStepBtn} 
          onPress={handleAdvanceStep}
        >
          <Text style={styles.advanceStepText}>
            {order.status === OrderStatus.READY_FOR_PICKUP && 'Confirm Pickup from Kitchen →'}
            {order.status === OrderStatus.PICKED_UP && 'Start Delivery to Doorstep →'}
            {order.status === OrderStatus.OUT_FOR_DELIVERY && 'Complete Delivery & Collect Payout →'}
            {order.status === OrderStatus.DELIVERED && 'Delivery Completed ✓'}
          </Text>
        </TouchableOpacity>
      </View>
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
  backBtnText: { color: '#f59e0b', fontSize: 13, fontWeight: '700' },
  headerTitle: { color: '#fafaf9', fontSize: 16, fontWeight: '700' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1917',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#292524',
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusText: { color: '#a8a29e', fontSize: 9, fontWeight: '800' },
  instructionBanner: {
    backgroundColor: '#1c1917',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#292524',
  },
  turnIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  distanceRemaining: { color: '#f59e0b', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  turnInstruction: { color: '#fafaf9', fontSize: 14, fontWeight: '700', marginTop: 2 },
  mapCanvas: {
    flex: 1,
    backgroundColor: '#141210',
    position: 'relative',
    overflow: 'hidden',
  },
  roadLine: {
    position: 'absolute',
    top: 60,
    left: 80,
    right: 90,
    bottom: 90,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#f59e0b',
    borderRadius: 60,
    opacity: 0.7,
  },
  mapPin: { position: 'absolute', alignItems: 'center' },
  pinLabel: {
    backgroundColor: 'rgba(12, 10, 9, 0.9)',
    color: '#fafaf9',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#292524',
  },
  riderPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    top: -6,
  },
  googleMapsFallbackBtn: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(28, 25, 23, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#44403c',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
  },
  googleMapsBtnText: { color: '#fafaf9', fontSize: 13, fontWeight: '700' },
  bottomCard: {
    backgroundColor: '#1c1917',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#292524',
  },
  destinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  destSub: { color: '#78716c', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  destTitle: { color: '#fafaf9', fontSize: 17, fontWeight: '700', marginTop: 2 },
  destAddr: { color: '#a8a29e', fontSize: 12, marginTop: 2, maxWidth: 240 },
  etaBox: {
    backgroundColor: '#0c0a09',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#292524',
  },
  etaNum: { color: '#f59e0b', fontSize: 20, fontWeight: '800' },
  etaUnit: { color: '#78716c', fontSize: 9, fontWeight: '800' },
  queueAlert: { color: '#f59e0b', fontSize: 11, marginBottom: 12, fontWeight: '600' },
  advanceStepBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  advanceStepText: { color: '#0c0a09', fontSize: 14, fontWeight: '800' },
});
