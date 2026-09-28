# Epicurean Curations — Design System Specification

## Brand & Gastronomic Movement

Epicurean Curations is an upscale food delivery application built for discerning epicures. It blends classical European trattoria heritage and artisanal culinary craftsmanship with contemporary digital elegance.

### Brand Personality
- **Artisanal & Gastronomic:** Celebrates culinary craft, slow fermentation, heritage ingredients (San Marzano DOP, Burrata Pugliese, Wagyu Bresaola, Black Truffle).
- **Warm & Tactile Elegance:** Rich terracotta carmine and toasted crust neutrals with airy spacing and refined typography.
- **Transparent & Reliable:** Real-time rider telemetry (Julian K. on Electric Vespa), clear breakdown of taxes and savings, and verified culinary certifications (Napoli Heritage Certified).

---

## Color Architecture (Material 3 Expressive)

| Token | Hex | Role |
| :--- | :--- | :--- |
| **Primary** | `#a83211` | Rich Carmine / Deep Terracotta — brand identity, primary buttons, active tabs |
| **Primary Container** | `#ca4a28` | Baked Terracotta — interactive cards, accents |
| **Primary Fixed** | `#ffdbd1` | Soft Peach Tint — offer badges, active pill backgrounds |
| **On Primary** | `#ffffff` | High contrast button text |
| **Surface** | `#fff8f5` | Warm Cream Canvas — ambient low-glare backdrop |
| **Surface Container Lowest** | `#ffffff` | Elevated dish and restaurant cards |
| **Surface Container Low** | `#faf2ee` | Soft grouped sections, address context bar |
| **Surface Container** | `#f4ece8` | Pill buttons, neutral action chips |
| **Surface Container High** | `#eee7e3` | Hovered card states and dividers |
| **Text Primary (on-surface)** | `#1e1b19` | Deep Espresso Charcoal — high contrast readability |
| **Text Secondary (on-surface-variant)** | `#59413b` | Muted Warm Cocoa — dish descriptions, metadata, provenance |
| **Tertiary** | `#006b2c` | Leaf Green — Pure Veg badges, culinary certifications |
| **Tertiary Fixed Dim** | `#62df7d` | Fresh Herb Green — freshness indicators |
| **Secondary** | `#835500` | Golden Crust Amber — star ratings, highlights |
| **Secondary Container** | `#feae2c` | Golden Saffron — review stars, gold patron badges |
| **Error** | `#ba1a1a` | Non-Veg badges, destructive actions |
| **Outline / Border** | `#e0d8d5` | Hairline card outlines and subtle dividers |

---

## Typography

- **Headlines & Display:** `Epilogue`, sans-serif (700 Bold / 600 SemiBold) — confident, editorial rhythm
- **Body, Titles & Labels:** `Plus Jakarta Sans`, sans-serif (400 Regular / 500 Medium / 600 SemiBold / 700 Bold)
- **Numerics & Pricing:** Enforce Indian Rupee symbol (₹) with whole integers (`₹549`, `₹649`)

---

## Screen Architecture

1. **Explore Home** (`screens/home.html`): Editorial discovery feed, address pill (`42 Artisan Row`), search bar, gourmet category filters (Pure Veg, Under 30 mins, 4.5+ Rating, Gourmet Offers), featured trattoria banner, chef specialties with quick "+ ADD" actions.
2. **Kitchen Detail** (`screens/restaurant.html`): Forno d'Oro Trattoria detail with stone-oven Neapolitan sourdough & burrata hero photography, provenance certifications, sticky category tabs, interactive dish customization bottom sheet.
3. **Bag / Cart** (`screens/cart.html`): Forno d'Oro Trattoria order list, item steppers, customisation notes, bill itemisation (subtotal, GST 5%, free delivery with Gold, rider tip ₹50, promo `EPICURE20`), sticky checkout button.
4. **Checkout** (`screens/checkout.html`): Delivery destination confirmation (42 Artisan Row, Apt 4B), delivery instructions, payment method selection (Razorpay UPI, Card, Cash on Delivery), order placement.
5. **Live Tracking** (`screens/tracking.html`): Live GPS map route (Forno d'Oro Trattoria to 42 Artisan Row), rider card (Julian K. on Electric Vespa, phone `+91 98470 12345`), 14 min countdown, 4-stage order progress.
6. **Order Confirmation** (`screens/success.html`): Order receipt, order ID, payment summary, quick link to live tracking.
7. **Patron Account** (`screens/account.html`): Epicure Gold membership status, saved addresses, order history, configuration for Google Maps & Razorpay API keys.
8. **App Shell** (`app.html`): Responsive mobile bezel container with persistent top navigation and bottom 5-tab bar (Explore, Kitchen, Bag, Orders, Account).
9. **Showcase Landing** (`index.html`): Web landing page showcasing the culinary delivery experience with live interactive mobile app iframe.
