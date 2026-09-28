import React, { createContext, useContext, useState, useMemo } from 'react';
import { IOrderItem, IOrderBill, IRestaurant, IMenuItem } from '@deliverapp/types';

export interface CartItem extends IOrderItem {
  itemData?: IMenuItem;
}

interface CartContextType {
  items: CartItem[];
  restaurant: IRestaurant | null;
  couponCode: string;
  bill: IOrderBill;
  addItem: (item: IMenuItem, restaurant: IRestaurant, options?: any[]) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, delta: number) => void;
  applyCoupon: (code: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [couponCode, setCouponCode] = useState<string>('EPICURE20');

  const addItem = (item: IMenuItem, targetRestaurant: IRestaurant, options: any[] = []) => {
    // If switching restaurants, clear existing cart
    if (restaurant && restaurant.id !== targetRestaurant.id) {
      setItems([]);
    }
    setRestaurant(targetRestaurant);

    const priceDelta = options.reduce((sum, opt) => sum + (opt.priceDelta || 0), 0);
    const unitPrice = item.price + priceDelta;

    setItems(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i =>
          i.menuItemId === item.id
            ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice }
            : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          unitPrice,
          quantity: 1,
          selectedOptions: options,
          totalPrice: unitPrice,
          itemData: item,
        }
      ];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setItems(prev => {
      return prev
        .map(i => {
          if (i.menuItemId === menuItemId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0
              ? { ...i, quantity: nextQty, totalPrice: nextQty * i.unitPrice }
              : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (menuItemId: string) => {
    setItems(prev => prev.filter(i => i.menuItemId !== menuItemId));
  };

  const clearCart = () => {
    setItems([]);
    setRestaurant(null);
  };

  const applyCoupon = (code: string) => {
    setCouponCode(code);
  };

  const bill: IOrderBill = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const deliveryFee = 0; // Gold Member complimentary delivery
    const riderTip = subtotal > 0 ? 50 : 0;

    let discount = 0;
    if (couponCode === 'EPICURE20' && subtotal >= 499) {
      discount = Math.min(149, Math.round(subtotal * 0.2));
    }

    const total = Math.max(0, subtotal + tax + deliveryFee + riderTip - discount);

    return {
      subtotal,
      tax,
      deliveryFee,
      riderTip,
      discount,
      couponCode,
      total,
    };
  }, [items, couponCode]);

  return (
    <CartContext.Provider
      value={{
        items,
        restaurant,
        couponCode,
        bill,
        addItem,
        removeItem,
        updateQuantity,
        applyCoupon,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
