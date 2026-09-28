import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { RestaurantScreen } from './src/screens/RestaurantScreen';
import { CartScreen } from './src/screens/CartScreen';
import { OrderTrackingScreen } from './src/screens/OrderTrackingScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { IRestaurant, IOrder } from '@deliverapp/types';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<'HOME' | 'RESTAURANT' | 'CART' | 'TRACKING' | 'AUTH'>('HOME');
  const [selectedRestaurant, setSelectedRestaurant] = useState<IRestaurant | null>(null);
  const [activeOrder, setActiveOrder] = useState<IOrder | null>(null);

  const handleSelectRestaurant = (restaurant: IRestaurant) => {
    setSelectedRestaurant(restaurant);
    setActiveScreen('RESTAURANT');
  };

  const handleOrderPlaced = (order: IOrder) => {
    setActiveOrder(order);
    setActiveScreen('TRACKING');
  };

  return (
    <AuthProvider>
      <CartProvider>
        <SafeAreaView style={styles.root}>
          <StatusBar barStyle="light-content" backgroundColor="#0c0a09" />

          {activeScreen === 'HOME' && (
            <HomeScreen
              onSelectRestaurant={handleSelectRestaurant}
              onOpenCart={() => setActiveScreen('CART')}
              onOpenAuth={() => setActiveScreen('AUTH')}
            />
          )}

          {activeScreen === 'RESTAURANT' && selectedRestaurant && (
            <RestaurantScreen
              restaurant={selectedRestaurant}
              onBack={() => setActiveScreen('HOME')}
              onOpenCart={() => setActiveScreen('CART')}
            />
          )}

          {activeScreen === 'CART' && (
            <CartScreen
              onBack={() => setActiveScreen(selectedRestaurant ? 'RESTAURANT' : 'HOME')}
              onOrderPlaced={handleOrderPlaced}
              onSelectAddress={() => setActiveScreen('AUTH')}
            />
          )}

          {activeScreen === 'TRACKING' && activeOrder && (
            <OrderTrackingScreen
              initialOrder={activeOrder}
              onDone={() => setActiveScreen('HOME')}
            />
          )}

          {activeScreen === 'AUTH' && (
            <AuthScreen
              onDone={() => setActiveScreen('HOME')}
            />
          )}
        </SafeAreaView>
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0c0a09',
  },
});
