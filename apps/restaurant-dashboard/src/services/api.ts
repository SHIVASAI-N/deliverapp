import { IOrder, OrderStatus, IRestaurant, IMenuItem } from '@deliverapp/types';

const BACKEND_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000') 
  : 'http://127.0.0.1:5000';

export async function fetchRestaurantOrders(restaurantId: string): Promise<IOrder[]> {
  const res = await fetch(`${BACKEND_URL}/api/v1/orders/restaurant/${restaurantId}`);
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.statusText}`);
  return res.json();
}

export async function updateOrderStatus(
  orderId: string, 
  nextStatus: OrderStatus, 
  reason?: string
): Promise<IOrder> {
  const res = await fetch(`${BACKEND_URL}/api/v1/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nextStatus,
      changedBy: 'RESTAURANT',
      reason: reason || `Updated by kitchen operator to ${nextStatus}`
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update order status');
  }
  return res.json();
}

export async function fetchRestaurantDetail(restaurantId: string): Promise<IRestaurant> {
  const res = await fetch(`${BACKEND_URL}/api/v1/restaurants/${restaurantId}`);
  if (!res.ok) throw new Error('Failed to fetch restaurant details');
  return res.json();
}

export async function toggleMenuItemStock(itemId: string, isAvailable: boolean): Promise<IMenuItem> {
  const res = await fetch(`${BACKEND_URL}/api/v1/restaurants/items/${itemId}/availability`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isAvailable })
  });
  if (!res.ok) throw new Error('Failed to toggle item availability');
  return res.json();
}

export function subscribeToLiveOrders(
  restaurantId: string, 
  onEvent: (event: { event: string; data: any }) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  // Connect via SSE endpoint
  const eventSource = new EventSource(`${BACKEND_URL}/api/v1/events/stream?restaurantId=${restaurantId}`);
  
  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onEvent(data);
    } catch (err) {
      console.warn('Failed to parse SSE event', err);
    }
  };

  eventSource.onerror = (err) => {
    console.error('SSE connection error:', err);
  };

  return () => {
    eventSource.close();
  };
}
