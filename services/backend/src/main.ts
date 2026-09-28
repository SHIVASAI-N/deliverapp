import * as http from 'http';
import * as crypto from 'crypto';
import { URL } from 'url';
import { AuthService } from './modules/auth/auth.service';
import { UserService } from './modules/user/user.service';
import { RestaurantService } from './modules/restaurant/restaurant.service';
import { OrderService } from './modules/order/order.service';
import { PaymentService } from './modules/payment/payment.service';
import { DeliveryService } from './modules/delivery/delivery.service';
import { DatabaseService } from './modules/db/in-memory-db.service';
import { OrderStatus } from '@deliverapp/types';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

const authService = new AuthService();
const userService = new UserService();
const restaurantService = new RestaurantService();
const orderService = new OrderService();
const paymentService = new PaymentService();
const deliveryService = new DeliveryService();
const db = DatabaseService.getInstance();

// Connected WebSocket & SSE clients for real-time order broadcasting
interface RealtimeClient {
  id: string;
  type: 'ws' | 'sse';
  orderId?: string;
  restaurantId?: string;
  send: (msg: string) => void;
  close: () => void;
}

const activeRealtimeClients = new Set<RealtimeClient>();

export function broadcastToOrderRoom(orderId: string, event: string, data: any) {
  const payload = JSON.stringify({ event, data });
  for (const client of activeRealtimeClients) {
    if (client.orderId === orderId) {
      client.send(payload);
    }
  }
}

export function broadcastToRestaurant(restaurantId: string, event: string, data: any) {
  const payload = JSON.stringify({ event, data });
  for (const client of activeRealtimeClients) {
    if (client.restaurantId === restaurantId) {
      client.send(payload);
    }
  }
}

function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON payload in request body.'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-idempotency-key'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-idempotency-key'
    });
    return res.end();
  }

  const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;
  const method = req.method;

  try {
    // -------------------------------------------------------------------------
    // 0. HEALTH CHECK
    // -------------------------------------------------------------------------
    if (pathname === '/health' || pathname === '/api/v1/health') {
      return sendJson(res, 200, {
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'DeliverApp Core Backend API',
        version: '1.0.0'
      });
    }

    // -------------------------------------------------------------------------
    // 1. AUTH SERVICE
    // -------------------------------------------------------------------------
    if (pathname === '/api/v1/auth/otp/send' && method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.phone) return sendJson(res, 400, { error: 'Phone number is required.' });
      const result = authService.sendOtp(body.phone);
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/v1/auth/otp/verify' && method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.phone || !body.code) return sendJson(res, 400, { error: 'Phone and code are required.' });
      const result = authService.verifyOtp(body.phone, body.code);
      return sendJson(res, 200, result);
    }

    // -------------------------------------------------------------------------
    // 2. USER SERVICE
    // -------------------------------------------------------------------------
    const userProfileMatch = pathname.match(/^\/api\/v1\/users\/([^/]+)\/profile$/);
    if (userProfileMatch && method === 'GET') {
      const user = userService.getProfile(userProfileMatch[1]);
      return sendJson(res, 200, user);
    }

    const userAddressesMatch = pathname.match(/^\/api\/v1\/users\/([^/]+)\/addresses$/);
    if (userAddressesMatch) {
      const userId = userAddressesMatch[1];
      if (method === 'GET') {
        const addresses = userService.getAddresses(userId);
        return sendJson(res, 200, addresses);
      }
      if (method === 'POST') {
        const body = await parseJsonBody(req);
        const address = userService.addAddress(userId, body);
        return sendJson(res, 201, address);
      }
    }

    const defaultAddressMatch = pathname.match(/^\/api\/v1\/users\/([^/]+)\/addresses\/([^/]+)\/default$/);
    if (defaultAddressMatch && method === 'PATCH') {
      const updated = userService.setDefaultAddress(defaultAddressMatch[1], defaultAddressMatch[2]);
      return sendJson(res, 200, updated);
    }

    // -------------------------------------------------------------------------
    // 3. RESTAURANT & CATALOG SERVICE
    // -------------------------------------------------------------------------
    if (pathname === '/api/v1/restaurants' && method === 'GET') {
      const pureVeg = reqUrl.searchParams.get('pureVeg') === 'true';
      const minRating = reqUrl.searchParams.get('minRating') ? parseFloat(reqUrl.searchParams.get('minRating')!) : undefined;
      const query = reqUrl.searchParams.get('query') || undefined;
      const restaurants = restaurantService.getRestaurants({ pureVeg, minRating, query });
      return sendJson(res, 200, restaurants);
    }

    const restaurantDetailMatch = pathname.match(/^\/api\/v1\/restaurants\/([^/]+)$/);
    if (restaurantDetailMatch && method === 'GET') {
      const restaurant = restaurantService.getRestaurantById(restaurantDetailMatch[1]);
      return sendJson(res, 200, restaurant);
    }

    const menuItemAvailMatch = pathname.match(/^\/api\/v1\/restaurants\/items\/([^/]+)\/availability$/);
    if (menuItemAvailMatch && method === 'PATCH') {
      const body = await parseJsonBody(req);
      const item = restaurantService.toggleMenuItemAvailability(menuItemAvailMatch[1], body.isAvailable);
      return sendJson(res, 200, item);
    }

    // -------------------------------------------------------------------------
    // 4. ORDER SERVICE (State Machine, Idempotency, Bill Calculator)
    // -------------------------------------------------------------------------
    if (pathname === '/api/v1/orders/quote' && method === 'POST') {
      const body = await parseJsonBody(req);
      const bill = orderService.calculateBill(body.items || [], body.couponCode, body.isGold !== false);
      return sendJson(res, 200, bill);
    }

    if (pathname === '/api/v1/orders' && method === 'POST') {
      const idempotencyKey = (req.headers['x-idempotency-key'] as string) || undefined;
      const body = await parseJsonBody(req);
      const order = orderService.createOrder({ ...body, idempotencyKey });
      broadcastToRestaurant(order.restaurantId, 'order:new_incoming', order);
      return sendJson(res, 201, order);
    }

    const orderDetailMatch = pathname.match(/^\/api\/v1\/orders\/([^/]+)$/);
    if (orderDetailMatch && method === 'GET') {
      const order = orderService.getOrderById(orderDetailMatch[1]);
      return sendJson(res, 200, order);
    }

    const customerOrdersMatch = pathname.match(/^\/api\/v1\/orders\/customer\/([^/]+)$/);
    if (customerOrdersMatch && method === 'GET') {
      const orders = orderService.getCustomerOrders(customerOrdersMatch[1]);
      return sendJson(res, 200, orders);
    }

    const restaurantOrdersMatch = pathname.match(/^\/api\/v1\/orders\/restaurant\/([^/]+)$/);
    if (restaurantOrdersMatch && method === 'GET') {
      const orders = orderService.getRestaurantOrders(restaurantOrdersMatch[1]);
      return sendJson(res, 200, orders);
    }

    // Order Lifecycle State Machine Transition
    const orderStatusMatch = pathname.match(/^\/api\/v1\/orders\/([^/]+)\/status$/);
    if (orderStatusMatch && method === 'PATCH') {
      const body = await parseJsonBody(req);
      const order = orderService.updateOrderStatus(
        orderStatusMatch[1],
        body.nextStatus as OrderStatus,
        body.changedBy || 'SYSTEM',
        body.reason
      );
      broadcastToOrderRoom(order.id, 'order:status_changed', {
        orderId: order.id,
        status: order.status,
        auditLog: order.auditLogs[order.auditLogs.length - 1],
        updatedAt: order.updatedAt
      });
      return sendJson(res, 200, order);
    }

    // -------------------------------------------------------------------------
    // 5. PAYMENT SERVICE (Idempotency & Webhooks)
    // -------------------------------------------------------------------------
    if (pathname === '/api/v1/payments/intent' && method === 'POST') {
      const body = await parseJsonBody(req);
      const intent = paymentService.createPaymentIntent(body);
      return sendJson(res, 201, intent);
    }

    if (pathname === '/api/v1/payments/webhook' && method === 'POST') {
      const body = await parseJsonBody(req);
      const result = paymentService.handleWebhook(body);
      return sendJson(res, 200, result);
    }

    // -------------------------------------------------------------------------
    // 6. DELIVERY, HOT LOCATION TELEMETRY & GOOGLE MAPS
    // -------------------------------------------------------------------------
    const orderTrackingMatch = pathname.match(/^\/api\/v1\/orders\/([^/]+)\/tracking$/);
    if (orderTrackingMatch && method === 'GET') {
      const trackingState = await deliveryService.getLiveTrackingState(orderTrackingMatch[1]);
      return sendJson(res, 200, trackingState);
    }

    const riderLocationMatch = pathname.match(/^\/api\/v1\/delivery\/riders\/([^/]+)\/location$/);
    if (riderLocationMatch && method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await deliveryService.updateLocation(riderLocationMatch[1], body, body.orderId);
      if (body.orderId) {
        broadcastToOrderRoom(body.orderId, 'order:rider_location', {
          orderId: body.orderId,
          riderId: riderLocationMatch[1],
          location: { ...body, timestamp: Date.now() },
          etaMinutes: result.etaMinutes
        });
      }
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/v1/delivery/riders/nearby' && method === 'GET') {
      const lat = parseFloat(reqUrl.searchParams.get('lat') || '9.9350');
      const lng = parseFloat(reqUrl.searchParams.get('lng') || '76.2710');
      const radius = parseFloat(reqUrl.searchParams.get('radius') || '5');
      const nearest = deliveryService.findNearestRiders(lat, lng, radius);
      return sendJson(res, 200, nearest);
    }

    const riderDetailMatch = pathname.match(/^\/api\/v1\/delivery\/riders\/([^/]+)$/);
    if (riderDetailMatch && method === 'GET') {
      const rider = deliveryService.getRider(riderDetailMatch[1]);
      return sendJson(res, 200, rider);
    }

    if (pathname === '/api/v1/delivery/riders' && method === 'GET') {
      const riders = deliveryService.getAllRiders();
      return sendJson(res, 200, riders);
    }

    // Google Routes API Proxy (server-side only, never called directly from client)
    if (pathname === '/api/v1/maps/route' && method === 'GET') {
      const origLat = parseFloat(reqUrl.searchParams.get('origLat') || '17.5645');
      const origLng = parseFloat(reqUrl.searchParams.get('origLng') || '78.4570');
      const destLat = parseFloat(reqUrl.searchParams.get('destLat') || '17.55714');
      const destLng = parseFloat(reqUrl.searchParams.get('destLng') || '78.44987');
      const route = await deliveryService['mapsService'].computeRoute(
        { lat: origLat, lng: origLng },
        { lat: destLat, lng: destLng }
      );
      return sendJson(res, 200, route);
    }

    // Google Geocoding API Proxy
    if (pathname === '/api/v1/maps/geocode' && method === 'GET') {
      const address = reqUrl.searchParams.get('address') || '';
      const geocoded = await deliveryService['mapsService'].geocode(address);
      return sendJson(res, 200, geocoded || { error: 'Address could not be geocoded' });
    }

    // OpenStreetMap Nominatim Reverse Geocoding Proxy (lat/lng -> Human street address & surroundings)
    if (pathname === '/api/v1/maps/reverse-geocode' && method === 'GET') {
      const lat = parseFloat(reqUrl.searchParams.get('lat') || '17.55714');
      const lng = parseFloat(reqUrl.searchParams.get('lng') || '78.44987');
      const reversed = await deliveryService['mapsService'].reverseGeocodeOSM(lat, lng);
      return sendJson(res, 200, reversed);
    }

    // -------------------------------------------------------------------------
    // 7. REAL-TIME SERVER-SENT EVENTS (SSE Fallback for any client)
    // -------------------------------------------------------------------------
    if (pathname === '/api/v1/events/stream' && method === 'GET') {
      const orderId = reqUrl.searchParams.get('orderId') || undefined;
      const restaurantId = reqUrl.searchParams.get('restaurantId') || undefined;

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.write(': connected\n\n');

      const client: RealtimeClient = {
        id: 'sse_' + Math.random().toString(36).substring(2, 9),
        type: 'sse',
        orderId,
        restaurantId,
        send: msg => { res.write(`data: ${msg}\n\n`); },
        close: () => { res.end(); }
      };

      activeRealtimeClients.add(client);
      req.on('close', () => { activeRealtimeClients.delete(client); });
      return;
    }

    // -------------------------------------------------------------------------
    // 8. ADMIN & ANALYTICS
    // -------------------------------------------------------------------------
    if (pathname === '/api/v1/admin/analytics' && method === 'GET') {
      const orders = Array.from(db.orders.values());
      const totalRevenue = orders.reduce((sum, o) => sum + (o.bill?.total || 0), 0);
      return sendJson(res, 200, {
        totalOrders: orders.length,
        grossMerchandiseValue: totalRevenue,
        activeOrders: orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED).length,
        totalRestaurants: db.restaurants.size,
        activeRiders: Array.from(db.riders.values()).filter(r => r.status !== 'OFFLINE').length
      });
    }

    // 404 Route Not Found
    return sendJson(res, 404, {
      statusCode: 404,
      error: 'Not Found',
      message: `Cannot ${method} ${pathname}`
    });

  } catch (err: any) {
    return sendJson(res, 500, {
      statusCode: 500,
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred.'
    });
  }
});

// RFC 6455 Native WebSocket Handshake Support
server.on('upgrade', (req, socket, head) => {
  const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const key = req.headers['sec-websocket-key'];

  if (!key) {
    socket.destroy();
    return;
  }

  const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
  const digest = crypto.createHash('sha1').update(key + GUID).digest('base64');

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${digest}\r\n\r\n`
  );

  const orderId = reqUrl.searchParams.get('orderId') || undefined;
  const restaurantId = reqUrl.searchParams.get('restaurantId') || undefined;

  const client: RealtimeClient = {
    id: 'ws_' + Math.random().toString(36).substring(2, 9),
    type: 'ws',
    orderId,
    restaurantId,
    send: (msg: string) => {
      try {
        const payloadBuffer = Buffer.from(msg);
        const length = payloadBuffer.length;
        let header: Buffer;
        if (length <= 125) {
          header = Buffer.from([0x81, length]);
        } else if (length <= 65535) {
          header = Buffer.alloc(4);
          header[0] = 0x81;
          header[1] = 126;
          header.writeUInt16BE(length, 2);
        } else {
          header = Buffer.alloc(10);
          header[0] = 0x81;
          header[1] = 127;
          header.writeBigUInt64BE(BigInt(length), 2);
        }
        socket.write(Buffer.concat([header, payloadBuffer]));
      } catch (e) {}
    },
    close: () => socket.destroy()
  };

  activeRealtimeClients.add(client);

  socket.on('data', buffer => {
    try {
      // Decode unmasked / masked WS text frame
      if (buffer.length < 2) return;
      const isMasked = (buffer[1] & 0x80) !== 0;
      let payloadLength = buffer[1] & 0x7f;
      let offset = 2;

      if (payloadLength === 126) {
        payloadLength = buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLength === 127) {
        payloadLength = Number(buffer.readBigUInt64BE(2));
        offset = 10;
      }

      let payload: Buffer;
      if (isMasked) {
        const mask = buffer.slice(offset, offset + 4);
        offset += 4;
        payload = buffer.slice(offset, offset + payloadLength);
        for (let i = 0; i < payload.length; i++) {
          payload[i] ^= mask[i % 4];
        }
      } else {
        payload = buffer.slice(offset, offset + payloadLength);
      }

      const parsed = JSON.parse(payload.toString());
      if (parsed.orderId) client.orderId = parsed.orderId;
      if (parsed.restaurantId) client.restaurantId = parsed.restaurantId;
    } catch (e) {}
  });

  socket.on('close', () => { activeRealtimeClients.delete(client); });
  socket.on('error', () => { activeRealtimeClients.delete(client); });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[DeliverApp] Core Backend running on http://0.0.0.0:${PORT}`);
  console.log(`[DeliverApp] Realtime WebSocket & SSE available on ws://0.0.0.0:${PORT} / /api/v1/events/stream`);
});
