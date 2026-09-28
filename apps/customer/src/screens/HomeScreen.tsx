import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { IRestaurant } from '@deliverapp/types';
import { fetchRestaurants } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface HomeScreenProps {
  onSelectRestaurant: (restaurant: IRestaurant) => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectRestaurant,
  onOpenCart,
  onOpenAuth
}) => {
  const { selectedAddress, user } = useAuth();
  const { items } = useCart();
  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pureVegOnly, setPureVegOnly] = useState(false);

  useEffect(() => {
    loadRestaurants();
  }, [searchQuery, pureVegOnly]);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const data = await fetchRestaurants(searchQuery, pureVegOnly);
      setRestaurants(data);
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalCartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.addressLabel}>DELIVERING TO</Text>
          <TouchableOpacity style={styles.addressRow} onPress={onOpenAuth}>
            <Text style={styles.addressText} numberOfLines={1}>
              📍 {selectedAddress ? selectedAddress.label : 'Select Delivery Location'}
            </Text>
            <Text style={styles.chevron}>▾</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.goldBadge} onPress={onOpenAuth}>
          <Text style={styles.goldText}>✨ GOLD</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search pizza, pasta, artisanal burgers..."
            placeholderTextColor="#78716c"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.vegFilterButton, pureVegOnly && styles.vegFilterButtonActive]}
          onPress={() => setPureVegOnly(!pureVegOnly)}
        >
          <Text style={[styles.vegFilterText, pureVegOnly && styles.vegFilterTextActive]}>
            🌱 Pure Veg
          </Text>
        </TouchableOpacity>
      </View>

      {/* Featured Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTag}>EPICUREAN SIGNATURE</Text>
          <Text style={styles.bannerTitle}>Woodfired Neapolitan Craft</Text>
          <Text style={styles.bannerSub}>Use code EPICURE20 for 20% off handcrafted pizzas</Text>
        </View>
      </View>

      {/* Restaurant List */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        <Text style={styles.sectionTitle}>Curated Kitchens Near You</Text>

        {loading ? (
          <ActivityIndicator color="#f59e0b" style={{ marginVertical: 32 }} />
        ) : (
          restaurants.map(rest => (
            <TouchableOpacity
              key={rest.id}
              style={styles.restaurantCard}
              activeOpacity={0.85}
              onPress={() => onSelectRestaurant(rest)}
            >
              <Image source={{ uri: rest.heroImageUrl }} style={styles.restaurantImage} />
              <View style={styles.cardRatingBadge}>
                <Text style={styles.ratingText}>★ {rest.rating}</Text>
                <Text style={styles.reviewCountText}>({rest.totalReviews})</Text>
              </View>

              <View style={styles.restaurantDetails}>
                <View style={styles.cardHeader}>
                  <Text style={styles.restaurantName}>{rest.name}</Text>
                  <Text style={styles.deliveryEstimate}>⏱ {rest.deliveryTimeEstimate}</Text>
                </View>

                <Text style={styles.tagline} numberOfLines={1}>{rest.tagline}</Text>
                <Text style={styles.cuisineText}>{rest.cuisine.join(' • ')}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.distanceText}>📍 {rest.distanceKm} km • {rest.address.area}</Text>
                  <Text style={styles.freeDeliveryText}>Free Delivery with Gold</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Cart Button if items exist */}
      {totalCartCount > 0 && (
        <TouchableOpacity style={styles.floatingCart} onPress={onOpenCart}>
          <View style={styles.cartCountPill}>
            <Text style={styles.cartCountText}>{totalCartCount}</Text>
          </View>
          <Text style={styles.floatingCartText}>View Order Cart</Text>
          <Text style={styles.floatingCartArrow}>→</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0a09' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1c1917',
  },
  addressLabel: { color: '#a8a29e', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, maxWidth: 240 },
  addressText: { color: '#f5f5f4', fontSize: 15, fontWeight: '700' },
  chevron: { color: '#f59e0b', fontSize: 14, marginLeft: 6 },
  goldBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  goldText: { color: '#f59e0b', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  searchSection: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', gap: 10 },
  searchBar: {
    flex: 1,
    backgroundColor: '#1c1917',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#292524',
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: '#f5f5f4', fontSize: 13 },
  vegFilterButton: {
    height: 44,
    paddingHorizontal: 14,
    backgroundColor: '#1c1917',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#292524',
  },
  vegFilterButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  vegFilterText: { color: '#a8a29e', fontSize: 12, fontWeight: '600' },
  vegFilterTextActive: { color: '#10b981' },
  banner: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#1c1917',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  bannerContent: { spaceY: 4 },
  bannerTag: { color: '#f59e0b', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  bannerTitle: { color: '#fafaf9', fontSize: 18, fontWeight: '700', marginTop: 2 },
  bannerSub: { color: '#a8a29e', fontSize: 12, marginTop: 4 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionTitle: { color: '#e7e5e4', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  restaurantCard: {
    backgroundColor: '#1c1917',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#292524',
  },
  restaurantImage: { width: '100%', height: 160 },
  cardRatingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(12, 10, 9, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#44403c',
  },
  ratingText: { color: '#f59e0b', fontSize: 12, fontWeight: '800', marginRight: 4 },
  reviewCountText: { color: '#a8a29e', fontSize: 10 },
  restaurantDetails: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  restaurantName: { color: '#fafaf9', fontSize: 17, fontWeight: '700' },
  deliveryEstimate: { color: '#10b981', fontSize: 12, fontWeight: '600' },
  tagline: { color: '#a8a29e', fontSize: 12, marginTop: 4 },
  cuisineText: { color: '#78716c', fontSize: 11, marginTop: 4 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#292524',
  },
  distanceText: { color: '#78716c', fontSize: 11 },
  freeDeliveryText: { color: '#f59e0b', fontSize: 11, fontWeight: '700' },
  floatingCart: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#f59e0b',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  cartCountPill: {
    backgroundColor: '#0c0a09',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCountText: { color: '#f59e0b', fontSize: 12, fontWeight: '800' },
  floatingCartText: { color: '#0c0a09', fontSize: 15, fontWeight: '800' },
  floatingCartArrow: { color: '#0c0a09', fontSize: 18, fontWeight: '800' },
});
