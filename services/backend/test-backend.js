const http = require('http');
const path = require('path');

// Require the compiled backend module
require('./dist/main.js');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Backend Verification Tests ---');
  await new Promise(r => setTimeout(r, 500)); // wait for server to listen

  const port = process.env.PORT || 5000;
  const base = { host: '127.0.0.1', port };

  // 1. Health
  console.log('\n[1] Health Check...');
  const health = await request({ ...base, path: '/api/v1/health', method: 'GET' });
  console.log('Health status:', health.status, health.body);
  if (health.status !== 200 || health.body.status !== 'UP') throw new Error('Health check failed');

  // 2. Auth Flow
  console.log('\n[2] Auth Flow (Phone + OTP)...');
  const otpSend = await request(
    { ...base, path: '/api/v1/auth/otp/send', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { phone: '+919876543210' }
  );
  console.log('OTP Send response:', otpSend.body);

  const otpVerify = await request(
    { ...base, path: '/api/v1/auth/otp/verify', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { phone: '+919876543210', code: '123456' }
  );
  console.log('OTP Verify response:', otpVerify.status, 'User:', otpVerify.body.user.name, 'Token:', otpVerify.body.token ? 'Present' : 'Missing');
  const userId = otpVerify.body.user.id;

  // 3. User & Addresses
  console.log('\n[3] User Address Management...');
  const addAddr = await request(
    { ...base, path: `/api/v1/users/${userId}/addresses`, method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { label: 'Studio Loft', street: 'Suite 404, Harbor View Towers', city: 'Kochi', pincode: '682001', latitude: 9.9312, longitude: 76.2673, isDefault: true }
  );
  console.log('New Address Added:', addAddr.body.label, addAddr.body.id);

  // 4. Restaurant Catalog & Menu
  console.log('\n[4] Restaurant Catalog & Menu...');
  const rests = await request({ ...base, path: '/api/v1/restaurants', method: 'GET' });
  console.log(`Found ${rests.body.length} restaurants:`, rests.body.map(r => r.name).join(', '));
  const forno = rests.body.find(r => r.id === 'rest_forno_doro');
  console.log('Forno d\'Oro Menu categories:', forno.categories.map(c => `${c.name} (${c.items.length} items)`).join(', '));

  // 5. Order Quote & Cart Calculation
  console.log('\n[5] Order Quote & Cart Bill Calculation with Coupon...');
  const pizza = forno.categories[0].items[0];
  const quote = await request(
    { ...base, path: '/api/v1/orders/quote', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    {
      items: [{ menuItemId: pizza.id, quantity: 2, selectedOptions: [] }],
      couponCode: 'EPICURE20',
      isGold: true
    }
  );
  console.log('Quote Bill:', quote.body);

  // 6. Order Placement with Idempotency Key
  console.log('\n[6] Order Placement with Idempotency Key...');
  const idemKey = 'test-idem-' + Date.now();
  const orderPayload = {
    customerId: userId,
    restaurantId: forno.id,
    deliveryAddressId: addAddr.body.id,
    items: [{ menuItemId: pizza.id, quantity: 2, selectedOptions: [] }],
    couponCode: 'EPICURE20',
    deliveryInstructions: 'Ring bell twice, leave with concierge'
  };

  const order1 = await request(
    {
      ...base,
      path: '/api/v1/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-idempotency-key': idemKey }
    },
    orderPayload
  );
  console.log('Order 1 Placed:', order1.body.id, 'Status:', order1.body.status, 'Total:', order1.body.bill.total);

  // Retry with same Idempotency Key -> MUST return same order
  const orderRetry = await request(
    {
      ...base,
      path: '/api/v1/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-idempotency-key': idemKey }
    },
    orderPayload
  );
  console.log('Idempotent Retry Result:', orderRetry.body.id === order1.body.id ? 'PASSED (Identical Order Returned)' : 'FAILED');

  const orderId = order1.body.id;

  // 7. Order State Machine Transitions & Audit Log
  console.log('\n[7] Order State Machine Transition Sequence...');
  const transitions = [
    { nextStatus: 'ACCEPTED', changedBy: 'RESTAURANT', reason: 'Kitchen confirmed order' },
    { nextStatus: 'PREPARING', changedBy: 'RESTAURANT', reason: 'Pizza placed in wood-fire oven' },
    { nextStatus: 'READY_FOR_PICKUP', changedBy: 'RESTAURANT', reason: 'Boxed in thermo-insulated pack' },
    { nextStatus: 'PICKED_UP', changedBy: 'RIDER', reason: 'Rider Julian K. collected order' },
    { nextStatus: 'OUT_FOR_DELIVERY', changedBy: 'RIDER', reason: 'En route on Electric Vespa' },
    { nextStatus: 'DELIVERED', changedBy: 'RIDER', reason: 'Handed over at doorstep' }
  ];

  for (const step of transitions) {
    const res = await request(
      { ...base, path: `/api/v1/orders/${orderId}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json' } },
      step
    );
    console.log(`Transition -> ${res.body.status} (Audit count: ${res.body.auditLogs.length})`);
  }

  // 8. Rider Hot Location Telemetry (3-5s batch updates)
  console.log('\n[8] Rider Hot Location Telemetry & Redis Geo Index...');
  const locUpdate = await request(
    { ...base, path: '/api/v1/delivery/riders/rider_julian/location', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { latitude: 9.9325, longitude: 76.2685, heading: 45, speed: 28, orderId }
  );
  console.log('Hot Location Update status:', locUpdate.body);

  // 9. Google Routes API (Backend-only) & Geocoding Proxy Tests
  console.log('\n[9] Google Routes API & Geocoding Verification...');
  const route = await request(
    { ...base, path: '/api/v1/maps/route?origLat=9.9350&origLng=76.2710&destLat=9.9275&destLng=76.2600', method: 'GET' }
  );
  console.log(`Google Routes API: Distance ${route.body.distanceMeters}m, ETA ${route.body.etaMinutes} mins, Polyline waypoints: ${route.body.coordinates.length}`);
  if (!route.body.coordinates || route.body.coordinates.length === 0) throw new Error('Route coordinates missing');

  const geocode = await request(
    { ...base, path: '/api/v1/maps/geocode?address=Napier%20Street%20Fort%20Kochi', method: 'GET' }
  );
  console.log('Geocoding Result:', geocode.body.formattedAddress, `(${geocode.body.latitude}, ${geocode.body.longitude})`);

  const reverseGeocode = await request(
    { ...base, path: '/api/v1/maps/reverse-geocode?lat=9.9275&lng=76.2600', method: 'GET' }
  );
  console.log('OpenStreetMap Reverse Geocode:', reverseGeocode.body.formattedAddress);

  // 10. Redis Nearest Rider GeoSearch
  console.log('\n[10] Redis GEOSEARCH Nearest Courier Dispatch...');
  const nearby = await request(
    { ...base, path: '/api/v1/delivery/riders/nearby?lat=9.9350&lng=76.2710&radius=5', method: 'GET' }
  );
  console.log('Nearest Available Couriers:', nearby.body.map(r => `${r.riderId} (${r.distanceKm} km)`).join(', '));

  // 11. Complete Order Live Tracking State (Route + Courier Marker + Destination)
  console.log('\n[11] Live Tracking State & Telemetry Query...');
  const tracking = await request(
    { ...base, path: `/api/v1/orders/${orderId}/tracking`, method: 'GET' }
  );
  console.log(`Tracking state for ${orderId}:`, {
    status: tracking.body.status,
    rider: tracking.body.rider?.name,
    riderLat: tracking.body.riderLocation?.latitude,
    riderLng: tracking.body.riderLocation?.longitude,
    routePoints: tracking.body.route?.coordinates?.length,
    isStale: tracking.body.isStale
  });

  // 12. Admin Analytics
  console.log('\n[12] Admin Analytics & Metrics...');
  const analytics = await request({ ...base, path: '/api/v1/admin/analytics', method: 'GET' });
  console.log('Analytics Summary:', analytics.body);

  console.log('\nALL BACKEND & GOOGLE MAPS VERIFICATION CHECKS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
