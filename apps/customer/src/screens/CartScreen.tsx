import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { placeOrder } from '../services/api';
import { IOrder } from '@deliverapp/types';

interface CartScreenProps {
  onBack: () => void;
  onOrderPlaced: (order: IOrder) => void;
  onSelectAddress: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  onBack,
  onOrderPlaced,
  onSelectAddress,
}) => {
  const { items, restaurant, bill, couponCode, applyCoupon, updateQuantity, clearCart } = useCart();
  const { user, selectedAddress } = useAuth();

  const [promoInput, setPromoInput] = useState(couponCode || 'EPICURE20');
  const [instructions, setInstructions] = useState('Ring bell twice, leave with concierge');
  const [paymentMode, setPaymentMode] = useState<'RAZORPAY' | 'STRIPE' | 'COD'>('RAZORPAY');
  const [isPlacing, setIsPlacing] = useState(false);

  const handleApplyCoupon = () => {
    applyCoupon(promoInput.trim().toUpperCase());
  };

  const handleCheckout = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in with your phone number to place orders.');
      return;
    }
    if (!restaurant) {
      Alert.alert('Empty Cart', 'Your cart is empty. Please select dishes from a restaurant.');
      return;
    }
    if (!selectedAddress) {
      Alert.alert('Address Needed', 'Please select or add a delivery address.');
      return;
    }

    try {
      setIsPlacing(true);
      // Generate unique idempotency key to prevent double charging on network retries
      const idempotencyKey = `idem_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const orderPayload = {
        customerId: user.id,
        restaurantId: restaurant.id,
        deliveryAddressId: selectedAddress.id,
        items: items.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          selectedOptions: i.selectedOptions,
          unitPrice: i.unitPrice,
          name: i.name,
          totalPrice: i.totalPrice
        })),
        couponCode: bill.discount > 0 ? couponCode : undefined,
        paymentMode,
        deliveryInstructions: instructions
      };

      const order = await placeOrder(orderPayload, idempotencyKey);
      clearCart();
      onOrderPlaced(order);
    } catch (err: any) {
      Alert.alert('Checkout Failed', err.message || 'Unable to place order.');
    } finally {
      setIsPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Your Basket is Empty</Text>
        <Text style={styles.emptySub}>Explore handcrafted dishes from artisanal kitchens near you.</Text>
        <TouchableOpacity style={styles.browseButton} onPress={onBack}>
          <Text style={styles.browseButtonText}>Browse Restaurants</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Restaurant Header */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>RESTAURANT</Text>
          <Text style={styles.restaurantName}>{restaurant?.name}</Text>
          <Text style={styles.restaurantArea}>📍 {restaurant?.address.street}, {restaurant?.address.area}</Text>
        </View>

        {/* Selected Dishes */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>DISHES SELECTED</Text>
          {items.map(item => (
            <View key={item.menuItemId} style={styles.cartItemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.selectedOptions && item.selectedOptions.length > 0 && (
                  <Text style={styles.itemOptions}>
                    ↳ {item.selectedOptions.map(o => o.name).join(', ')}
                  </Text>
                )}
                <Text style={styles.itemUnit}>₹{item.unitPrice} each</Text>
              </View>

              <View style={styles.qtyControl}>
                <TouchableOpacity onPress={() => updateQuantity(item.menuItemId, -1)} style={styles.qtyBtn}>
                  <Text style={styles.qtyText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item.menuItemId, 1)} style={styles.qtyBtn}>
                  <Text style={styles.qtyText}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.itemTotal}>₹{item.totalPrice}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <TouchableOpacity style={styles.sectionCard} onPress={onSelectAddress}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionHeader}>DELIVER TO</Text>
            <Text style={styles.changeAddressText}>Change</Text>
          </View>
          <Text style={styles.addressLabel}>{selectedAddress?.label}</Text>
          <Text style={styles.addressStreet}>{selectedAddress?.street}, {selectedAddress?.area}</Text>
        </TouchableOpacity>

        {/* Special Instructions */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>DELIVERY NOTES</Text>
          <TextInput
            style={styles.inputNotes}
            placeholder="Special instructions for rider (e.g. Ring bell, gate code)..."
            placeholderTextColor="#78716c"
            value={instructions}
            onChangeText={setInstructions}
          />
        </View>

        {/* Coupon Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>COUPON &amp; OFFERS</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              value={promoInput}
              onChangeText={setPromoInput}
              placeholder="ENTER PROMO CODE"
              placeholderTextColor="#78716c"
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.applyCouponBtn} onPress={handleApplyCoupon}>
              <Text style={styles.applyCouponText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {bill.discount > 0 && (
            <Text style={styles.appliedPromoText}>
              ✓ Applied &apos;{bill.couponCode}&apos;: ₹{bill.discount} discount unlocked!
            </Text>
          )}
        </View>

        {/* Payment Mode Selector */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>PAYMENT METHOD (PCI COMPLIANT TEST MODE)</Text>
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[styles.paymentPill, paymentMode === 'RAZORPAY' && styles.paymentPillActive]}
              onPress={() => setPaymentMode('RAZORPAY')}
            >
              <Text style={[styles.paymentText, paymentMode === 'RAZORPAY' && styles.paymentTextActive]}>
                💳 Razorpay UPI / Cards
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentPill, paymentMode === 'STRIPE' && styles.paymentPillActive]}
              onPress={() => setPaymentMode('STRIPE')}
            >
              <Text style={[styles.paymentText, paymentMode === 'STRIPE' && styles.paymentTextActive]}>
                ⚡ Stripe Tokenized
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Detailed Bill Summary */}
        <View style={[styles.sectionCard, styles.billCard]}>
          <Text style={styles.sectionHeader}>BILL BREAKDOWN</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billValue}>₹{bill.subtotal}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>GST &amp; Restaurant Packaging (5%)</Text>
            <Text style={styles.billValue}>₹{bill.tax}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Partner Fee</Text>
            <Text style={[styles.billValue, { color: '#10b981' }]}>
              {bill.deliveryFee === 0 ? 'FREE (Gold Member)' : `₹${bill.deliveryFee}`}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Courier Appreciation Tip</Text>
            <Text style={styles.billValue}>₹{bill.riderTip}</Text>
          </View>

          {bill.discount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: '#f59e0b' }]}>Coupon Discount ({bill.couponCode})</Text>
              <Text style={[styles.billValue, { color: '#f59e0b' }]}>-₹{bill.discount}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{bill.total}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order CTA */}
      <View style={styles.footerCTA}>
        <View>
          <Text style={styles.footerTotalLabel}>TO PAY</Text>
          <Text style={styles.footerTotalValue}>₹{bill.total}</Text>
        </View>

        <TouchableOpacity
          disabled={isPlacing}
          style={[styles.checkoutBtn, isPlacing && styles.checkoutBtnDisabled]}
          onPress={handleCheckout}
        >
          {isPlacing ? (
            <ActivityIndicator color="#0c0a09" />
          ) : (
            <Text style={styles.checkoutBtnText}>Place Order →</Text>
          )}
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
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1c1917',
  },
  backBtnText: { color: '#f59e0b', fontSize: 14, fontWeight: '700' },
  headerTitle: { color: '#fafaf9', fontSize: 16, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 120 },
  sectionCard: {
    backgroundColor: '#1c1917',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#292524',
  },
  sectionHeader: { color: '#78716c', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  restaurantName: { color: '#fafaf9', fontSize: 16, fontWeight: '700' },
  restaurantArea: { color: '#a8a29e', fontSize: 12, marginTop: 2 },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#292524',
  },
  itemName: { color: '#fafaf9', fontSize: 14, fontWeight: '600' },
  itemOptions: { color: '#f59e0b', fontSize: 11, marginTop: 2 },
  itemUnit: { color: '#78716c', fontSize: 11, marginTop: 2 },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c0a09',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#44403c',
    marginHorizontal: 12,
  },
  qtyBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  qtyText: { color: '#f59e0b', fontSize: 14, fontWeight: '800' },
  qtyValue: { color: '#fafaf9', fontSize: 12, fontWeight: '700', minWidth: 14, textAlign: 'center' },
  itemTotal: { color: '#fafaf9', fontSize: 13, fontWeight: '700', minWidth: 44, textAlign: 'right' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  changeAddressText: { color: '#f59e0b', fontSize: 12, fontWeight: '700' },
  addressLabel: { color: '#fafaf9', fontSize: 14, fontWeight: '700' },
  addressStreet: { color: '#a8a29e', fontSize: 12, marginTop: 2 },
  inputNotes: {
    backgroundColor: '#0c0a09',
    borderWidth: 1,
    borderColor: '#292524',
    borderRadius: 8,
    padding: 10,
    color: '#fafaf9',
    fontSize: 12,
  },
  couponRow: { flexDirection: 'row', gap: 8 },
  couponInput: {
    flex: 1,
    backgroundColor: '#0c0a09',
    borderWidth: 1,
    borderColor: '#292524',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  applyCouponBtn: {
    backgroundColor: '#292524',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyCouponText: { color: '#fafaf9', fontSize: 12, fontWeight: '700' },
  appliedPromoText: { color: '#10b981', fontSize: 11, fontWeight: '600', marginTop: 8 },
  paymentOptions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  paymentPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#0c0a09',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#292524',
    alignItems: 'center',
  },
  paymentPillActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' },
  paymentText: { color: '#78716c', fontSize: 11, fontWeight: '600' },
  paymentTextActive: { color: '#f59e0b', fontWeight: '700' },
  billCard: { backgroundColor: '#141210' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  billLabel: { color: '#a8a29e', fontSize: 12 },
  billValue: { color: '#fafaf9', fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#292524', marginVertical: 8 },
  totalLabel: { color: '#fafaf9', fontSize: 14, fontWeight: '800' },
  totalValue: { color: '#f59e0b', fontSize: 16, fontWeight: '800' },
  footerCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1c1917',
    borderTopWidth: 1,
    borderTopColor: '#292524',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerTotalLabel: { color: '#78716c', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  footerTotalValue: { color: '#fafaf9', fontSize: 18, fontWeight: '800' },
  checkoutBtn: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  checkoutBtnDisabled: { opacity: 0.6 },
  checkoutBtnText: { color: '#0c0a09', fontSize: 14, fontWeight: '800' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c0a09', padding: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#fafaf9', fontSize: 20, fontWeight: '700' },
  emptySub: { color: '#78716c', fontSize: 13, textAlign: 'center', marginTop: 6, maxWidth: 260 },
  browseButton: { backgroundColor: '#f59e0b', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, marginTop: 20 },
  browseButtonText: { color: '#0c0a09', fontSize: 13, fontWeight: '800' },
});
