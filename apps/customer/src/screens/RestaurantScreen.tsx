import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Modal 
} from 'react-native';
import { IRestaurant, IMenuItem, IMenuItemOptionGroup, IMenuItemOptionChoice } from '@deliverapp/types';
import { useCart } from '../context/CartContext';

interface RestaurantScreenProps {
  restaurant: IRestaurant;
  onBack: () => void;
  onOpenCart: () => void;
}

export const RestaurantScreen: React.FC<RestaurantScreenProps> = ({
  restaurant,
  onBack,
  onOpenCart,
}) => {
  const { items, addItem, updateQuantity } = useCart();
  const [selectedItemForOptions, setSelectedItemForOptions] = useState<IMenuItem | null>(null);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, IMenuItemOptionChoice>>({});

  const handleAddItemClick = (item: IMenuItem) => {
    if (!item.isAvailable) return;

    if (item.optionGroups && item.optionGroups.length > 0) {
      // Open customization modal
      setSelectedItemForOptions(item);
      const defaults: Record<string, IMenuItemOptionChoice> = {};
      item.optionGroups.forEach(grp => {
        const def = grp.choices.find(c => c.isDefault) || grp.choices[0];
        if (def && grp.required) defaults[grp.id] = def;
      });
      setSelectedChoices(defaults);
    } else {
      addItem(item, restaurant, []);
    }
  };

  const handleConfirmCustomization = () => {
    if (!selectedItemForOptions) return;
    const choices = Object.values(selectedChoices);
    addItem(selectedItemForOptions, restaurant, choices);
    setSelectedItemForOptions(null);
  };

  const getItemQuantityInCart = (itemId: string) => {
    const found = items.find(i => i.menuItemId === itemId);
    return found ? found.quantity : 0;
  };

  const totalCartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{restaurant.name}</Text>
        <TouchableOpacity style={styles.shareBadge}>
          <Text style={styles.shareText}>★ {restaurant.rating}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero image and restaurant card */}
        <Image source={{ uri: restaurant.heroImageUrl }} style={styles.heroImage} />

        <View style={styles.infoCard}>
          <Text style={styles.title}>{restaurant.name}</Text>
          <Text style={styles.tagline}>{restaurant.tagline}</Text>
          <Text style={styles.metaText}>
            ⏱ {restaurant.deliveryTimeEstimate} • 📍 {restaurant.distanceKm} km • {restaurant.address.area}
          </Text>
        </View>

        {/* Menu Categories */}
        {restaurant.categories && restaurant.categories.map(category => (
          <View key={category.id} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.name}</Text>

            <View style={styles.itemsList}>
              {category.items.map(item => {
                const qty = getItemQuantityInCart(item.id);
                return (
                  <View key={item.id} style={styles.menuItemCard}>
                    <View style={styles.itemTextContainer}>
                      <View style={styles.vegRow}>
                        <View style={[styles.vegBadge, { borderColor: item.isVeg ? '#10b981' : '#ef4444' }]}>
                          <View style={[styles.vegDot, { backgroundColor: item.isVeg ? '#10b981' : '#ef4444' }]} />
                        </View>
                        {item.tag && (
                          <Text style={styles.itemTagBadge}>{item.tag}</Text>
                        )}
                      </View>

                      <Text style={[styles.itemName, !item.isAvailable && styles.itemDisabled]}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemPrice}>₹{item.price}</Text>
                      <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                    </View>

                    <View style={styles.itemImageContainer}>
                      {item.imageUrl && (
                        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                      )}

                      {/* Add Button or Quantity Selector */}
                      {!item.isAvailable ? (
                        <View style={styles.soldOutBadge}>
                          <Text style={styles.soldOutText}>Sold Out</Text>
                        </View>
                      ) : qty > 0 ? (
                        <View style={styles.qtyControl}>
                          <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qtyBtn}>
                            <Text style={styles.qtyBtnText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.qtyValue}>{qty}</Text>
                          <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.qtyBtn}>
                            <Text style={styles.qtyBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.addButton}
                          onPress={() => handleAddItemClick(item)}
                        >
                          <Text style={styles.addButtonText}>ADD</Text>
                          {item.optionGroups && item.optionGroups.length > 0 && (
                            <Text style={styles.customizableText}>Customizable</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Customization Modal */}
      {selectedItemForOptions && (
        <Modal transparent animationType="slide" visible={!!selectedItemForOptions}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedItemForOptions.name}</Text>
                  <Text style={styles.modalPrice}>Base: ₹{selectedItemForOptions.price}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedItemForOptions(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {selectedItemForOptions.optionGroups?.map(group => (
                  <View key={group.id} style={styles.optionGroup}>
                    <Text style={styles.groupTitle}>
                      {group.title} {group.required ? '*(Required)' : '(Optional)'}
                    </Text>

                    {group.choices.map(choice => {
                      const isSelected = selectedChoices[group.id]?.id === choice.id;
                      return (
                        <TouchableOpacity
                          key={choice.id}
                          style={[styles.choiceRow, isSelected && styles.choiceRowSelected]}
                          onPress={() => {
                            setSelectedChoices(prev => ({ ...prev, [group.id]: choice }));
                          }}
                        >
                          <Text style={[styles.choiceName, isSelected && styles.choiceNameSelected]}>
                            {choice.name}
                          </Text>
                          <Text style={styles.choiceDelta}>
                            {choice.priceDelta > 0 ? `+₹${choice.priceDelta}` : 'Free'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.confirmCustomButton} onPress={handleConfirmCustomization}>
                <Text style={styles.confirmCustomText}>Add Item with Options</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Floating Bottom Cart Bar */}
      {totalCartCount > 0 && (
        <View style={styles.bottomCartBar}>
          <View>
            <Text style={styles.cartBarCount}>{totalCartCount} item(s) selected</Text>
            <Text style={styles.cartBarTotal}>₹{cartSubtotal} plus taxes</Text>
          </View>
          <TouchableOpacity style={styles.viewCartBtn} onPress={onOpenCart}>
            <Text style={styles.viewCartBtnText}>View Cart →</Text>
          </TouchableOpacity>
        </View>
      )}
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
    backgroundColor: '#0c0a09',
  },
  backButton: { paddingVertical: 4 },
  backButtonText: { color: '#f59e0b', fontSize: 14, fontWeight: '700' },
  headerTitle: { color: '#fafaf9', fontSize: 16, fontWeight: '700', maxWidth: 200 },
  shareBadge: { backgroundColor: '#1c1917', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  shareText: { color: '#f59e0b', fontSize: 12, fontWeight: '800' },
  scrollContent: { paddingBottom: 120 },
  heroImage: { width: '100%', height: 180 },
  infoCard: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1c1917' },
  title: { color: '#fafaf9', fontSize: 22, fontWeight: '800' },
  tagline: { color: '#a8a29e', fontSize: 13, marginTop: 4 },
  metaText: { color: '#78716c', fontSize: 12, marginTop: 8 },
  categorySection: { marginTop: 20, paddingHorizontal: 20 },
  categoryTitle: { color: '#f59e0b', fontSize: 14, fontWeight: '800', letterSpacing: 0.5, marginBottom: 14 },
  itemsList: { spaceY: 16 },
  menuItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1917',
  },
  itemTextContainer: { flex: 1, paddingRight: 14 },
  vegRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  vegBadge: { width: 14, height: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 2 },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  itemTagBadge: { color: '#f59e0b', fontSize: 10, fontWeight: '700', backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  itemName: { color: '#fafaf9', fontSize: 15, fontWeight: '700' },
  itemDisabled: { color: '#78716c', textDecorationLine: 'line-through' },
  itemPrice: { color: '#e7e5e4', fontSize: 14, fontWeight: '700', marginVertical: 4 },
  itemDesc: { color: '#78716c', fontSize: 12, lineHeight: 16 },
  itemImageContainer: { width: 110, alignItems: 'center' },
  itemImage: { width: 100, height: 80, borderRadius: 10, marginBottom: 8 },
  addButton: {
    backgroundColor: '#1c1917',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: 90,
  },
  addButtonText: { color: '#f59e0b', fontSize: 12, fontWeight: '800' },
  customizableText: { color: '#a8a29e', fontSize: 9, marginTop: 2 },
  soldOutBadge: { backgroundColor: '#292524', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  soldOutText: { color: '#78716c', fontSize: 11, fontWeight: '600' },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1917',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#44403c',
    overflow: 'hidden',
  },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  qtyBtnText: { color: '#f59e0b', fontSize: 16, fontWeight: '800' },
  qtyValue: { color: '#fafaf9', fontSize: 13, fontWeight: '700', minWidth: 16, textAlign: 'center' },
  bottomCartBar: {
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
  cartBarCount: { color: '#a8a29e', fontSize: 11 },
  cartBarTotal: { color: '#fafaf9', fontSize: 15, fontWeight: '800' },
  viewCartBtn: {
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  viewCartBtnText: { color: '#0c0a09', fontSize: 13, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#1c1917',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#292524' },
  modalTitle: { color: '#fafaf9', fontSize: 17, fontWeight: '700' },
  modalPrice: { color: '#f59e0b', fontSize: 13, marginTop: 2 },
  closeBtn: { color: '#a8a29e', fontSize: 18, padding: 4 },
  modalBody: { paddingVertical: 14 },
  optionGroup: { marginBottom: 16 },
  groupTitle: { color: '#a8a29e', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  choiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#292524',
    marginBottom: 6,
  },
  choiceRowSelected: { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' },
  choiceName: { color: '#e7e5e4', fontSize: 13 },
  choiceNameSelected: { color: '#f59e0b', fontWeight: '700' },
  choiceDelta: { color: '#a8a29e', fontSize: 12 },
  confirmCustomButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmCustomText: { color: '#0c0a09', fontSize: 14, fontWeight: '800' },
});
