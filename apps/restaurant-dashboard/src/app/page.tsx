'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IOrder, OrderStatus } from '@deliverapp/types';
import { MetricsHeader } from '../components/MetricsHeader';
import { OrderKanban } from '../components/OrderKanban';
import { 
  fetchRestaurantOrders, 
  updateOrderStatus, 
  subscribeToLiveOrders 
} from '../services/api';

const RESTAURANT_ID = 'rest_forno_doro';

export default function RestaurantDashboardPage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  // Load initial orders
  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchRestaurantOrders(RESTAURANT_ID);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load restaurant orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();

    // Subscribe to live SSE/WebSocket events
    const unsubscribe = subscribeToLiveOrders(RESTAURANT_ID, (event) => {
      console.log('[Dashboard] Live event received:', event);
      if (event.event === 'order:new_incoming') {
        setOrders(prev => [event.data, ...prev.filter(o => o.id !== event.data.id)]);
        // Play notification tone
        try {
          const audio = new Audio('/kitchen-bell.mp3');
          audio.play().catch(() => {});
        } catch (e) {}
      } else if (event.event === 'order:status_changed') {
        setOrders(prev => prev.map(o => o.id === event.data.orderId ? { ...o, status: event.data.status } : o));
      }
    });

    return () => unsubscribe();
  }, [loadOrders]);

  // Order state transition handler
  const handleTransition = async (orderId: string, nextStatus: OrderStatus, reason?: string) => {
    try {
      setIsUpdating(orderId);
      const updated = await updateOrderStatus(orderId, nextStatus, reason);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    } catch (err: any) {
      alert(`Transition error: ${err.message}`);
    } finally {
      setIsUpdating(null);
    }
  };

  const activeOrders = orders.filter(
    o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED
  );
  const totalRevenue = orders.reduce((sum, o) => sum + (o.bill?.total || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-400 uppercase tracking-widest font-mono">Synchronizing Kitchen OS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MetricsHeader
        activeCount={activeOrders.length}
        totalRevenue={totalRevenue}
        avgPrepMinutes={18}
        isOpen={isOpen}
        onToggleStatus={() => setIsOpen(!isOpen)}
      />

      <div className="flex-1">
        <OrderKanban
          orders={orders}
          onTransition={handleTransition}
          isUpdating={isUpdating}
        />
      </div>
    </div>
  );
}
