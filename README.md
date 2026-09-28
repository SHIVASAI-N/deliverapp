# 🍕 DeliverApp (Epicurean Curations) — Production-Grade Food Delivery Platform

A production-grade, multi-application food delivery ecosystem built with a monorepo architecture. DeliverApp powers high-end culinary delivery, connecting patrons, artisan kitchens, and delivery couriers through a unified backend and real-time event pipeline.

---

## 🏗️ Architecture & Tech Stack

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    SHARED CONTRACTS                    │
                               │                packages/types (@deliverapp/types)       │
                               └──────────────┬───────────────────┬─────────────────────┘
                                              │                   │
                     ┌────────────────────────┼───────────────────┼────────────────────────┐
                     │                        │                   │                        │
                     ▼                        ▼                   ▼                        ▼
        ┌─────────────────────────┐ ┌───────────────────┐ ┌──────────────────────┐ ┌───────────────┐
        │      apps/customer      │ │apps/restaurant-   │ │ apps/delivery-partner│ │  Stitch Web   │
        │   React Native (Expo)   │ │    dashboard      │ │  React Native (Expo) │ │    Viewport   │
        │ Patron Food Discovery & │ │  Next.js (React)  │ │Courier OS & Hot GPS  │ │  (HTML5/Tail- │
        │  Live Tracking Screen   │ │Kitchen Operator OS│ │  Batch Telemetry     │ │   wind/Vite)  │
        └────────────┬────────────┘ └─────────┬─────────┘ └──────────┬───────────┘ └───────┬───────┘
                     │                        │                      │                      │
                     │  HTTP / REST           │  HTTP / REST         │  HTTP / REST         │
                     │  WebSocket & SSE       │  WebSocket & SSE     │  Telemetry (3-5s)    │
                     └────────────────────────┼──────────────────────┼──────────────────────┘
                                              ▼
                               ┌─────────────────────────────┐
                               │       services/backend      │
                               │   Node.js / NestJS Engine   │
                               │  Deterministic State Machine│
                               │  Idempotency Key Guard      │
                               │  Native RFC 6455 WS & SSE   │
                               └──────────────┬──────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
        ┌───────────────────────────┐                   ┌───────────────────────────┐
        │   PostgreSQL 16 (Prisma)  │                   │     Redis 7 Hot Cache     │
        │ Orders, Users, Menus,     │                   │ Real-time Courier GPS,    │
        │ Transactions, Audit Logs  │                   │ Sessions & WS Rooms       │
        └───────────────────────────┘                   └───────────────────────────┘
```

### Stack Components

| Layer | Technology | Key Features & Responsibilities |
| :--- | :--- | :--- |
| **Frontend Customer** | **React Native (Expo)** | Cross-platform (iOS/Android/Web), OTP auth, dish customization sheet, coupon discounts, live order tracking stepper. |
| **Frontend Restaurant** | **Next.js (React 18)** | Web-based operator dashboard, live ticket Kanban columns, 1-click status transitions, audio chime on incoming orders, menu 86'ing / stock toggle. |
| **Frontend Delivery** | **React Native (Expo)** | Courier OS, job offers, pickup & dropoff verification, batched GPS telemetry generator. |
| **Shared Contracts** | **TypeScript (`@deliverapp/types`)** | Shared models, `OrderStatus` enum, transition validators, bill structures, socket event definitions. |
| **Core Backend** | **Node.js / NestJS (TypeScript)** | Modular architecture: Auth, Users, Restaurants, Orders, Payments, Logistics, Analytics, Realtime Gateway. |
| **Relational Database** | **PostgreSQL 16 (Prisma ORM)** | ACID transactions for orders, payments, audit history, and menu catalogues. |
| **Hot Cache & Telemetry** | **Redis 7** | In-memory courier coordinates (3-5s batch updates) preventing relational database bottleneck. |
| **Realtime Layer** | **Native RFC 6455 WS & SSE** | Bidirectional real-time broadcasting to order rooms (`order_<id>`) and restaurant kitchens. |
| **Payments** | **Razorpay & Stripe (Test Mode)** | Tokenized intent generation, webhook processing, idempotency protection against double billing. |
| **Infrastructure** | **Docker & GitHub Actions** | Multi-stage Dockerfiles, Docker Compose stack, automated CI/CD pipeline. |

---

## 📦 Monorepo Workspace Structure

```
deliverapp/
├── packages/
│   └── types/                      # Shared TypeScript data models and contracts
│       ├── src/
│       │   ├── order.ts            # OrderStatus, transition map, IOrder, IOrderBill, IOrderAuditLog
│       │   ├── restaurant.ts       # IRestaurant, IMenuItem, IMenuCategory, option groups
│       │   ├── user.ts             # IUser, IAddress, auth payloads
│       │   ├── delivery.ts         # IRider, IRiderLocation, dispatch jobs
│       │   ├── payment.ts          # IPaymentIntent, idempotency records
│       │   └── events.ts           # WebSocket & SSE event signatures
│       └── package.json
│
├── services/
│   └── backend/                    # Core Backend API & Real-Time Engine
│       ├── prisma/
│       │   └── schema.prisma       # Complete PostgreSQL relational schema
│       ├── src/
│       │   ├── common/
│       │   │   ├── state-machine/  # OrderStateMachine enforcing deterministic lifecycle
│       │   │   └── interceptors/   # IdempotencyStore preventing duplicate charges
│       │   ├── modules/
│       │   │   ├── auth/           # Phone & OTP session management
│       │   │   ├── user/           # User profiles & address CRUD
│       │   │   ├── restaurant/     # Catalog, cuisine filtering, menu item availability
│       │   │   ├── order/          # Cart quote, 5% GST bill calculation, checkout
│       │   │   ├── payment/        # Razorpay/Stripe intents & webhook simulator
│       │   │   ├── delivery/       # Hot location updates & rider telemetry
│       │   │   ├── gateway/        # Real-time WebSocket room dispatcher
│       │   │   └── db/             # Dual-mode In-Memory & PostgreSQL database service
│       │   └── main.ts             # HTTP REST + WebSocket + SSE server
│       ├── test-backend.js         # End-to-end automated verification test suite
│       ├── build.js                # esbuild bundler script
│       ├── Dockerfile              # Production Docker container image
│       └── package.json
│
├── apps/
│   ├── restaurant-dashboard/       # Next.js Kitchen Operator Panel
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx        # Live Orders Kanban & State Transition Board
│   │   │   │   ├── menu/page.tsx   # Menu Availability & 86'ing Stock Manager
│   │   │   │   └── layout.tsx      # Dark luxury restaurant theme
│   │   │   ├── components/         # MetricsHeader, OrderKanban, MenuInventoryToggle
│   │   │   └── services/api.ts     # Real-time SSE subscriber & REST client
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── customer/                   # React Native (Expo) Customer App
│   │   ├── src/
│   │   │   ├── screens/            # HomeScreen, RestaurantScreen, CartScreen, OrderTrackingScreen, AuthScreen
│   │   │   ├── context/            # AuthContext, CartContext (5% GST, EPICURE20 coupon)
│   │   │   └── services/api.ts     # Client SDK for backend endpoints
│   │   ├── App.tsx                 # Root mobile view navigation
│   │   ├── app.json
│   │   └── package.json
│   │
│   └── delivery-partner/           # React Native (Expo) Courier App
│       ├── src/
│       │   ├── screens/            # RiderHomeScreen (Shift toggle, job progression)
│       │   └── services/           # RiderTelemetryService (3-5s GPS batching)
│       ├── App.tsx
│       ├── app.json
│       └── package.json
│
├── .github/workflows/ci.yml        # CI/CD workflow for linting, testing, and Docker builds
├── docker-compose.yml              # Local Postgres, Redis, Backend, and Dashboard stack
├── turbo.json                      # Turborepo task pipeline configuration
├── .env.example                    # Environment variable template
└── package.json                    # Monorepo root workspace orchestrator
```

---

## ⚡ Core Engineering Requirements Implemented

### 1. Deterministic Order State Machine & Audit Trail
Orders follow a strict transition hierarchy. Invalid transitions (e.g. attempting to jump from `PLACED` to `DELIVERED` or cancelling after `PICKED_UP`) throw an explicit `400 Bad Request`. Every valid transition records an immutable audit log entry with `previousStatus`, `newStatus`, `changedBy` (`CUSTOMER` | `RESTAURANT` | `RIDER` | `SYSTEM`), timestamp, and reason:

```
[PLACED] ──────► [ACCEPTED] ──────► [PREPARING] ──────► [READY_FOR_PICKUP]
   │                 │                   │                       │
   ▼ (Cancellation)  ▼ (Cancellation)    ▼ (Cancellation)        ▼
[CANCELLED]       [CANCELLED]         [CANCELLED]          [PICKED_UP]
                                                                 │
                                                                 ▼
                                                        [OUT_FOR_DELIVERY]
                                                                 │
                                                                 ▼
                                                            [DELIVERED]
```

### 2. Idempotency Key Architecture (`x-idempotency-key`)
To guarantee that network retries or double-taps do not create duplicate orders or double-charge customer payment accounts, `POST /api/v1/orders` and `POST /api/v1/payments/intent` require an `x-idempotency-key` header. If a request with an existing key is received, the backend immediately returns the identical cached response without re-executing order creation or card charging.

### 3. Hot Redis Location Layer (3-5s GPS Batch Updates)
Couriers in motion stream location coordinates (`latitude`, `longitude`, `heading`, `speed`) every 3 to 5 seconds. Rather than hammering the PostgreSQL disk on each ping:
1. Pings hit `POST /api/v1/delivery/riders/:id/location`.
2. Coordinates are stored in the fast in-memory / Redis cache (`riderHotLocations`).
3. Updates are immediately broadcast to active WebSocket/SSE clients in room `order_<id>`.
4. The relational database is touched only when order status transitions occur.

### 4. Bill Calculation & Promotions
The checkout service applies:
- Base subtotal from item pricing and selected modifier options (e.g., *Whole Ancient Spelt Crust* `+₹49`, *Double Burrata Pugliese* `+₹129`).
- 5% Goods and Services Tax (GST).
- Complimentary delivery for Gold Members (`isGoldMember: true`).
- Courier tip (`₹50`).
- Promo code validation (`EPICURE20` yields 20% off up to `₹149` on orders above `₹499`).

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- Docker & Docker Compose (optional for containerized deployment)

### 1. Run the Backend & Verification Tests

To verify all backend services, state machine transitions, idempotency checks, and catalog queries:

```bash
# Run the automated backend test suite
npm test
```

Expected output:
```
--- Starting Backend Verification Tests ---
[DeliverApp] Core Backend running on http://0.0.0.0:8080
[DeliverApp] Realtime WebSocket & SSE available on ws://0.0.0.0:8080 / /api/v1/events/stream

[1] Health Check... -> UP
[2] Auth Flow (Phone + OTP)... -> Passed
[3] User Address Management... -> Passed (Studio Loft added)
[4] Restaurant Catalog & Menu... -> Found 2 restaurants
[5] Order Quote & Cart Bill Calculation with Coupon... -> Subtotal: ₹1,098, GST: ₹55, Discount: ₹149, Total: ₹1,054
[6] Order Placement with Idempotency Key... -> Order EP-9156 placed
    Idempotent Retry Result: PASSED (Identical Order Returned)
[7] Order State Machine Transition Sequence...
    Transition -> ACCEPTED (Audit count: 2)
    Transition -> PREPARING (Audit count: 3)
    Transition -> READY_FOR_PICKUP (Audit count: 4)
    Transition -> PICKED_UP (Audit count: 5)
    Transition -> OUT_FOR_DELIVERY (Audit count: 6)
    Transition -> DELIVERED (Audit count: 7)
[8] Rider Hot Location Telemetry... -> Hot Location Update: { success: true }
[9] Admin Analytics & Metrics... -> Orders: 2, GMV: ₹2,262, Active Riders: 1

ALL BACKEND VERIFICATION CHECKS PASSED SUCCESSFULLY!
```

### 2. Start the Backend API Server

```bash
# Start backend on default port 5000
npm run backend:dev
```

### 3. Start the Applications

```bash
# 1. Restaurant Dashboard (Next.js - port 3000)
npm run dashboard:dev

# 2. Customer App (React Native Expo)
npm run customer:start

# 3. Delivery Partner App (React Native Expo)
npm run rider:start

# Or start all concurrently via Turborepo
npm run dev:all
```

---

## 🐳 Docker Compose Deployment

Run the complete production stack (PostgreSQL 16, Redis 7, Backend Service, and Restaurant Dashboard) in isolated containers:

```bash
# Copy environment variables
cp .env.example .env

# Spin up all containers
docker-compose up --build
```

Endpoints when running via Docker Compose:
- **Core Backend REST & Realtime API:** `http://localhost:5000`
- **Restaurant Kitchen Dashboard:** `http://localhost:3000`
- **PostgreSQL Database:** `localhost:5432` (`deliverapp_db`)
- **Redis Cache:** `localhost:6379`

---

## 🧪 API Endpoints Reference

### Auth Service
- `POST /api/v1/auth/otp/send` — Request 6-digit phone login OTP.
- `POST /api/v1/auth/otp/verify` — Verify code and generate JWT session.

### User Service
- `GET /api/v1/users/:id/profile` — Retrieve profile & Gold status.
- `GET /api/v1/users/:id/addresses` — List saved delivery locations.
- `POST /api/v1/users/:id/addresses` — Add home/work/custom address.
- `PATCH /api/v1/users/:id/addresses/:addrId/default` — Set default address.

### Restaurant & Catalog Service
- `GET /api/v1/restaurants` — Search restaurants with `query`, `pureVeg`, and `minRating`.
- `GET /api/v1/restaurants/:id` — Full restaurant catalog with categorized menu & modifier option groups.
- `PATCH /api/v1/restaurants/items/:itemId/availability` — Real-time kitchen 86 / stock toggle.

### Order Service
- `POST /api/v1/orders/quote` — Compute cart bill with 5% GST, tips, and coupon discounts.
- `POST /api/v1/orders` — Create order (`x-idempotency-key` supported).
- `GET /api/v1/orders/:id` — Retrieve order details and audit timeline.
- `GET /api/v1/orders/customer/:customerId` — Customer order history.
- `GET /api/v1/orders/restaurant/:restaurantId` — Kitchen order queue.
- `PATCH /api/v1/orders/:id/status` — State machine transition with actor validation.

### Payment Service
- `POST /api/v1/payments/intent` — Create tokenized payment intent (Razorpay/Stripe).
- `POST /api/v1/payments/webhook` — Process gateway settlement webhooks.

### Delivery & Telemetry Service
- `POST /api/v1/delivery/riders/:id/location` — Batched high-frequency GPS ping (3-5s).
- `GET /api/v1/delivery/riders/:id` — Courier details, vehicle info, rating.
- `GET /api/v1/delivery/riders/nearby?lat=...&lng=...&radius=...` — Redis `GEOSEARCH` nearest available couriers.
- `GET /api/v1/orders/:id/tracking` — Live tracking payload (courier GPS, polyline coordinates, distance, ETA, and stale indicator).

### Google Maps Platform Proxy Service (Backend Only)
- `GET /api/v1/maps/route?originLat=...&originLng=...&destLat=...&destLng=...` — Proxy to Google Routes API (`directions/v2:computeRoutes`) with 60-second cache.
- `GET /api/v1/maps/geocode?address=...` — Forward Geocoding API proxy for validated delivery coordinates.

### Realtime Layer
- `GET /api/v1/events/stream?orderId=...&restaurantId=...` — Real-time Server-Sent Events (SSE).
- `ws://<host>:<port>` — RFC 6455 native WebSocket connection.

---

## 🗺️ Google Maps Live Tracking Architecture

DeliverApp implements an enterprise-grade live delivery tracking architecture using Google Maps Platform services.

### 1. High-Level Telemetry & Routing Topology

```
┌─────────────────────────────────┐
│     Courier Phone (Expo App)    │
│  Foreground & Background GPS    │
│  Batch 3-5s + Offline Buffer    │
└────────────────┬────────────────┘
                 │ POST /delivery/riders/:id/location
                 ▼
┌────────────────────────────────────────────────────────┐
│                   Backend Service                      │
│ 1. Verify courier assignment to order                 │
│ 2. Redis GEOADD (Spatial index for courier dispatch)   │
│ 3. Redis HSET (Latest coordinates + timestamp)         │
│ 4. Cache Routes API polyline (60s TTL)                │
│ 5. Throttle PostgreSQL breadcrumbs (30s)               │
│ 6. Broadcast 'order:rider_location' to room order_<id> │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│    Customer Mobile App      │ │ Restaurant Web Dashboard    │
│  react-native-maps          │ │ @vis.gl/react-google-maps   │
│  PROVIDER_GOOGLE            │ │ AdvancedMarkerElement       │
│  Animated Marker Gliding    │ │ Route & Courier Live Radar  │
│  Auto-fit Camera & Recenter │ │ Stale (>30s) Ping Warning   │
└─────────────────────────────┘ └─────────────────────────────┘
```

### 2. Core Implementation Highlights
- **Strict Backend Proxying**: Google Routes API (`directions/v2:computeRoutes`) and Geocoding API (`/maps/api/geocode/json`) are called strictly from `services/backend`. Frontend clients never call Google Routes or Geocoding APIs directly, preventing key theft and bypassing CORS restrictions.
- **Offline Resilient Telemetry**: When network drops, the Courier app (`apps/delivery-partner`) buffers up to 50 location pings with precise timestamps and headings, flushing them in order upon reconnection.
- **Turn-by-Turn Navigation & Native Fallback**: Couriers see real-time route instructions with remaining distance/ETA and a 1-tap fallback button that launches native Google Maps navigation (`Linking.openURL`).
- **Smooth Marker Gliding & Orientation**: Customer and Restaurant interfaces animate the courier marker between GPS coordinates using position interpolation (`Animated.timing`) and heading rotation.
- **Stale Telemetry Watchdog**: If no GPS update arrives for 30+ seconds, clients automatically display an amber warning: *"Rider is not sharing location right now"*.

### 3. Four-Tier API Key Security Model
To maintain least privilege and prevent unauthorized quota drainage, DeliverApp uses four distinctly scoped Google Maps API keys:

1. **Backend Server Key (`GOOGLE_MAPS_SERVER_KEY`)**:
   - Scope: Routes API, Geocoding API, Places API.
   - Restriction: Static Backend Server IP addresses.
2. **Web Dashboard Key (`NEXT_PUBLIC_GOOGLE_MAPS_WEB_KEY`)**:
   - Scope: Maps JavaScript API.
   - Restriction: HTTP Referrers (e.g., `https://kitchen.deliverapp.com/*`, `http://localhost:3000/*`).
3. **Android Native Key (`EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY`)**:
   - Scope: Maps SDK for Android (`PROVIDER_GOOGLE`).
   - Restriction: Android package name (`com.deliverapp.customer`) and SHA-1 certificate fingerprint.
4. **iOS Native Key (`EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY`)**:
   - Scope: Maps SDK for iOS (`PROVIDER_GOOGLE`).
   - Restriction: iOS Bundle Identifier (`com.deliverapp.customer`).

---

## 📋 Google Maps Platform Compliance & Legal Notice

This application integrates Google Maps Platform services in compliance with Google's development standards and terms:

1. **Cost & Billing Notice**: Google Maps Platform APIs (Routes API, Maps JavaScript API, Maps SDK for Android/iOS, and Geocoding API) are commercial services billed per request/session beyond Google's recurring monthly credit. Always monitor your GCP billing dashboard and set budget alerts.
2. **Products Used**:
   - Google Routes API (`directions/v2:computeRoutes`)
   - Google Maps JavaScript API (via `@vis.gl/react-google-maps`)
   - Google Maps SDK for Android & iOS (via `react-native-maps`)
   - Google Geocoding API
3. **API Key Restrictions Guide**: For instructions on restricting your API keys by IP, HTTP referrer, and mobile app identity, consult the official guide: [Google Maps Platform API Key Best Practices](https://developers.google.com/maps/api-security-best-practices).
4. **License Notice**: Code incorporating Google Maps samples and integration wrappers is provided under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0).
5. **Terms of Service**: By using Google Maps Platform services, you agree to be bound by the [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms/).
# deliverapp
