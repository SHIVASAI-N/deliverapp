import { 
  IRestaurant, 
  IOrder, 
  IOrderBill, 
  IUser, 
  IAddress 
} from '@deliverapp/types';

const API_BASE_URL = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL
  ? process.env.EXPO_PUBLIC_API_URL
  : 'http://localhost:5000';

export async function sendOtp(phone: string): Promise<{ success: boolean; testOtp?: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) throw new Error('Failed to send OTP');
  return res.json();
}

export async function verifyOtp(phone: string, code: string): Promise<{ user: IUser; token: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });
  if (!res.ok) throw new Error('Invalid OTP or verification failure');
  return res.json();
}

export async function fetchRestaurants(query?: string, pureVeg?: boolean): Promise<IRestaurant[]> {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (pureVeg) params.append('pureVeg', 'true');
  const res = await fetch(`${API_BASE_URL}/api/v1/restaurants?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch restaurant listings');
  return res.json();
}

export async function fetchRestaurantById(id: string): Promise<IRestaurant> {
  const res = await fetch(`${API_BASE_URL}/api/v1/restaurants/${id}`);
  if (!res.ok) throw new Error('Restaurant not found');
  return res.json();
}

export async function fetchUserAddresses(userId: string): Promise<IAddress[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/addresses`);
  if (!res.ok) throw new Error('Failed to fetch user addresses');
  return res.json();
}

export async function addUserAddress(userId: string, address: Partial<IAddress>): Promise<IAddress> {
  const res = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/addresses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(address),
  });
  if (!res.ok) throw new Error('Failed to save address');
  return res.json();
}

export async function calculateQuote(
  items: any[],
  couponCode?: string,
  isGold = true
): Promise<IOrderBill> {
  const res = await fetch(`${API_BASE_URL}/api/v1/orders/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, couponCode, isGold }),
  });
  if (!res.ok) throw new Error('Failed to compute cart quote');
  return res.json();
}

export async function placeOrder(
  payload: {
    customerId: string;
    restaurantId: string;
    items: any[];
    deliveryAddressId?: string;
    couponCode?: string;
    paymentMode?: 'RAZORPAY' | 'STRIPE' | 'COD';
    deliveryInstructions?: string;
  },
  idempotencyKey?: string
): Promise<IOrder> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (idempotencyKey) {
    headers['x-idempotency-key'] = idempotencyKey;
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to place order');
  }
  return res.json();
}

export async function fetchOrderById(orderId: string): Promise<IOrder> {
  const res = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}`);
  if (!res.ok) throw new Error('Failed to fetch order details');
  return res.json();
}

export async function fetchLiveTrackingState(orderId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}/tracking`);
  if (!res.ok) throw new Error('Failed to fetch live tracking state');
  return res.json();
}

export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number; formattedAddress: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/maps/geocode?address=${encodeURIComponent(address)}`);
  if (!res.ok) throw new Error('Geocoding failed');
  return res.json();
}

export function subscribeToOrderTracking(
  orderId: string,
  onEvent: (event: { event: string; data: any }) => void
): () => void {
  let active = true;
  let eventSource: any = null;

  function connect() {
    if (!active || typeof EventSource === 'undefined') return;

    eventSource = new EventSource(`${API_BASE_URL}/api/v1/events/stream?orderId=${orderId}`);
    eventSource.onmessage = (e: any) => {
      try {
        const data = JSON.parse(e.data);
        onEvent(data);
      } catch (err) {
        console.warn('Error parsing tracking stream event', err);
      }
    };

    eventSource.onerror = () => {
      if (eventSource) eventSource.close();
      if (active) {
        // Automatic reconnect after 3 seconds
        setTimeout(connect, 3000);
      }
    };
  }

  connect();

  return () => {
    active = false;
    if (eventSource) eventSource.close();
  };
}
