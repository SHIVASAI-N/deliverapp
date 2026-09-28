import { IRider, IOrder, OrderStatus } from '@deliverapp/types';

const API_BASE_URL = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL
  ? process.env.EXPO_PUBLIC_API_URL
  : 'http://localhost:5000';

export async function fetchRiderProfile(riderId: string = 'rider_julian'): Promise<IRider> {
  const res = await fetch(`${API_BASE_URL}/api/v1/delivery/riders/${riderId}`);
  if (!res.ok) throw new Error('Failed to load rider details');
  return res.json();
}

export async function fetchAssignedOrder(orderId: string): Promise<IOrder> {
  const res = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}`);
  if (!res.ok) throw new Error('Order not found');
  return res.json();
}

export async function updateDeliveryStatus(
  orderId: string, 
  nextStatus: OrderStatus, 
  reason?: string
): Promise<IOrder> {
  const res = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nextStatus,
      changedBy: 'RIDER',
      reason: reason || `Updated by Courier to ${nextStatus}`
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Status transition error');
  }
  return res.json();
}
