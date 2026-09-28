/**
 * DeliverApp / Epicurean Curations — Unified Store Engine
 * Supports the complete Customer, Restaurant, and Delivery Partner ordering flows.
 * Handles Menu items, Customizations, Add-ons, Cart, Coupons, Saved Addresses,
 * Order State Progression (7 States), Reviews, and Partner/Kitchen Dashboards.
 */
(function() {
  const CART_KEY = 'deliverapp_cart_v2';
  const ORDER_KEY = 'deliverapp_orders_v2';
  const ADDR_KEY = 'deliverapp_address_v2';
  const SAVED_ADDR_KEY = 'deliverapp_saved_addresses_v2';
  const ACTIVE_COUPON_KEY = 'deliverapp_active_coupon_v2';
  const REVIEWS_KEY = 'deliverapp_reviews_v2';

  // Indian Rupee formatting
  window.money = function(n) {
    return '₹' + Math.round(+n || 0).toLocaleString('en-IN');
  };

  function readStorage(k, fallback) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeStorage(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  }

  // Curated Menu with Authentic Indian, Arabian & International Specialties
  window.MENU = [
    // --- 1. Lazeez Arabian Mandi & Shawarma (Maisammaguda, Dulapally 500100) ---
    {
      id: 'juicy-mutton-mandi',
      restaurantId: 'lazeez-mandi',
      name: 'Juicy Mutton Mandi',
      desc: 'Tender slow-cooked spiced mutton over aromatic smoked mandi rice with roasted dry fruits, served with hot mutton yakhni broth & spicy tomato chutney.',
      price: 380,
      veg: false,
      rating: 4.9,
      ratingCount: 2180,
      customisable: true,
      category: 'Mandi',
      tag: 'Maisammaguda Bestseller',
      rest: "Lazeez Arabian Mandi & Shawarma",
      img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'extra-mutton-piece', name: 'Extra Tender Mutton Piece', price: 180 },
        { id: 'extra-mandi-rice', name: 'Extra Fragrant Mandi Rice Portion', price: 70 },
        { id: 'boiled-egg-mandi', name: 'Farm-Fresh Boiled Egg', price: 20 },
        { id: 'spicy-mayo-dip', name: 'Arabian Spicy Mayonnaise Dip', price: 30 }
      ],
      options: [
        { name: 'Portion Size', choices: ['Single (Serves 1)', 'Double Mandi Platter (Serves 2, +₹340)'] },
        { name: 'Spice Level', choices: ['Medium Arabian Spice', 'Extra Spicy Hyderabadi Style'] }
      ]
    },
    {
      id: 'chicken-alfaham-mandi',
      restaurantId: 'lazeez-mandi',
      name: 'Chicken Al-Faham Mandi',
      desc: 'Charcoal flame-grilled spiced chicken quarter over aromatic basmati mandi rice, accompanied by whipped garlic toum dip and flavorful soup.',
      price: 260,
      veg: false,
      rating: 4.8,
      ratingCount: 1650,
      customisable: true,
      category: 'Mandi',
      tag: 'Student Favorite',
      rest: "Lazeez Arabian Mandi & Shawarma",
      img: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'extra-alfaham-quarter', name: 'Extra Al-Faham Chicken Quarter', price: 130 },
        { id: 'extra-garlic-toum', name: 'Authentic Garlic Toum Dip', price: 30 },
        { id: 'fried-onion-crunch', name: 'Biryani Fried Onion & Cashew Garnish', price: 25 }
      ],
      options: [
        { name: 'Preparation', choices: ['Classic Arabian Herb & Lemon', 'Fiery Peri-Peri Spiced'] }
      ]
    },
    {
      id: 'rumali-chicken-shawarma',
      restaurantId: 'lazeez-mandi',
      name: 'Special Rumali Chicken Shawarma',
      desc: 'Hand-stretched soft rumali roti rolled with spiced shredded roasted chicken, pickled Persian cucumbers, authentic garlic toum & crisp salted fries.',
      price: 130,
      veg: false,
      rating: 4.8,
      ratingCount: 3420,
      customisable: true,
      category: 'Shawarma',
      tag: 'Campus Hit',
      rest: "Lazeez Arabian Mandi & Shawarma",
      img: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'extra-cheese-slice', name: 'Melted Cheddar Cheese Slice', price: 25 },
        { id: 'extra-meat-only', name: 'Only Chicken (Zero Salad / No Veggies)', price: 40 },
        { id: 'pickled-jalapenos', name: 'Sliced Jalapenos & Olives', price: 20 }
      ],
      options: [
        { name: 'Sauce Blend', choices: ['Classic Garlic Toum', 'Spicy Chipotle Schezwan'] }
      ]
    },
    {
      id: 'two-piece-jumbo-mandi',
      restaurantId: 'lazeez-mandi',
      name: 'Two Piece Special Chicken Mandi',
      desc: 'Two jumbo roasted chicken pieces served on a gigantic platter of smoked mandi rice with boiled eggs, crispy nuts, and rich soup. Feeds 2 to 3.',
      price: 420,
      veg: false,
      rating: 4.9,
      ratingCount: 1100,
      customisable: true,
      category: 'Mandi',
      tag: 'Grand Feast',
      rest: "Lazeez Arabian Mandi & Shawarma",
      img: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'extra-soup-bowl', name: 'Extra Mutton Yakhni Soup Bowl', price: 40 },
        { id: 'extra-cashew-topping', name: 'Roasted Golden Cashew Cup', price: 45 }
      ],
      options: [
        { name: 'Rice Variety', choices: ['Traditional Smoked Mandi Rice', 'Spiced Bukhari Rice'] }
      ]
    },
    {
      id: 'arabic-cheese-kunafa',
      restaurantId: 'lazeez-mandi',
      name: 'Crispy Arabic Cheese Kunafa',
      desc: 'Golden oven-baked spun filo pastry stuffed with molten sweet akkawi cheese, soaked in cardamom orange blossom syrup and topped with crushed pistachios.',
      price: 199,
      veg: true,
      rating: 4.9,
      ratingCount: 890,
      customisable: false,
      category: 'Desserts',
      tag: 'Chef Signature',
      rest: "Lazeez Arabian Mandi & Shawarma",
      img: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'extra-pistachio-crumb', name: 'Extra Iranian Pistachio Crumb', price: 30 },
        { id: 'malai-cream-dollop', name: 'Chilled Sweet Malai Cream Dollop', price: 25 }
      ]
    },

    // --- 2. My Village Kitchen (Dulapally Cross Road, Maisammaguda 500100) ---
    {
      id: 'natu-kodi-pulao',
      restaurantId: 'my-village-kitchen',
      name: 'Telangana Natu Kodi Pulao',
      desc: 'Tender country chicken simmered in desi ghee with green chilli paste, curry leaves, and fragrant Seeraga Samba short-grain rice with authentic Telangana spices.',
      price: 299,
      veg: false,
      rating: 4.8,
      ratingCount: 1420,
      customisable: true,
      category: 'Village Specials',
      tag: 'Telangana Heritage',
      rest: "My Village Kitchen",
      img: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'extra-natu-gravy', name: 'Extra Natu Kodi Spicy Gravy', price: 60 },
        { id: 'village-boiled-egg', name: 'Desi Boiled Egg (1 pc)', price: 20 },
        { id: 'kaju-topping-natu', name: 'Roasted Cashew Nut Topping', price: 40 }
      ],
      options: [
        { name: 'Spice Level', choices: ['Spicy (Authentic Telangana)', 'Extreme Guntur Heat'] }
      ]
    },
    {
      id: 'bamboo-chicken',
      restaurantId: 'my-village-kitchen',
      name: 'Araku Valley Bamboo Chicken',
      desc: 'Fresh wild green bamboo stuffed with herb-marinated boneless country chicken and slow-roasted on burning wood coals. Oil-free and intensely smoky.',
      price: 270,
      veg: false,
      rating: 4.9,
      ratingCount: 960,
      customisable: true,
      category: 'Village Specials',
      tag: 'Tribal Woodsmoke',
      rest: "My Village Kitchen",
      img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'extra-onion-salad', name: 'Guntur Onion & Lemon Salad', price: 20 },
        { id: 'hot-chapati-basket', name: 'Village Hot Chapati (2 pcs)', price: 40 }
      ],
      options: [
        { name: 'Marinade', choices: ['Wild Herb & Black Pepper', 'Red Chilli & Tamarind'] }
      ]
    },
    {
      id: 'ulavacharu-biryani',
      restaurantId: 'my-village-kitchen',
      name: 'Clay Pot Ulavacharu Chicken Biryani',
      desc: 'Traditional Andhra slow-brewed horsegram gravy infused with dum basmati rice, succulent chicken pieces and caramelized onions served in an earthen clay pot.',
      price: 289,
      veg: false,
      rating: 4.8,
      ratingCount: 1250,
      customisable: true,
      category: 'Biryani',
      tag: 'Andhra Royal',
      rest: "My Village Kitchen",
      img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'fresh-malai-dollop', name: 'Fresh Dairy Malai Cream Dollop', price: 25 },
        { id: 'extra-ulavacharu-cup', name: 'Extra Pure Ulavacharu Cup', price: 50 }
      ],
      options: [
        { name: 'Spice Level', choices: ['Medium Spice', 'Andhra Spicy'] }
      ]
    },
    {
      id: 'guntur-paneer-vepudu',
      restaurantId: 'my-village-kitchen',
      name: 'Guntur Mirchi Paneer Vepudu',
      desc: 'Crisp malai paneer cubes stir-fried with freshly pounded Guntur red chillies, crushed black peppercorns, curry leaf tempering, and golden cashews.',
      price: 220,
      veg: true,
      rating: 4.7,
      ratingCount: 780,
      customisable: false,
      category: 'Starters',
      tag: 'Spicy Veg',
      rest: "My Village Kitchen",
      img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'extra-cashew-guntur', name: 'Extra Roasted Cashew Nuts', price: 40 }
      ]
    },
    {
      id: 'kaju-pulao',
      restaurantId: 'my-village-kitchen',
      name: 'Pachi Mirchi Kaju Pulao',
      desc: 'Fragrant ghee bagara rice loaded with crunchy whole roasted cashews, crushed bird’s eye green chillies and fresh garden mint leaves.',
      price: 250,
      veg: true,
      rating: 4.7,
      ratingCount: 650,
      customisable: false,
      category: 'Biryani',
      tag: 'Pure Veg',
      rest: "My Village Kitchen",
      img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'extra-kaju-bowl', name: 'Extra Fried Golden Cashews (50g)', price: 60 },
        { id: 'mirchi-salan-village', name: 'Spicy Sesame Mirchi Salan', price: 35 }
      ]
    },

    // --- 3. Garden Bakery & Fast Food (College Road, Maisammaguda 500100) ---
    {
      id: 'chicken-65-roll',
      restaurantId: 'garden-bakery',
      name: 'Loaded Chicken 65 Frankie Roll',
      desc: 'Warm flaky paratha roll packed with spicy Hyderabadi Chicken 65 bites, crunchy pickled onions, tangy chaat masala, and mint toum mayonnaise.',
      price: 110,
      veg: false,
      rating: 4.7,
      ratingCount: 1540,
      customisable: true,
      category: 'Fast Food',
      tag: 'Quick Snack',
      rest: "Garden Bakery & Fast Food",
      img: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'extra-cheese-frankie', name: 'Double Mozzarella Cheese', price: 25 },
        { id: 'egg-coating', name: 'Egg-Coated Paratha Layer', price: 20 }
      ],
      options: [
        { name: 'Mayo Choice', choices: ['Mint Mayo', 'Peri-Peri Mayo', 'Extra Spicy Schezwan'] }
      ]
    },
    {
      id: 'nutella-thick-shake',
      restaurantId: 'garden-bakery',
      name: 'Nutella Brownie Thick Shake',
      desc: 'Thick creamy vanilla ice cream whipped with rich Italian Ferrero Nutella spread, dense chocolate brownie crumbs and chocolate fudge swirl.',
      price: 139,
      veg: true,
      rating: 4.9,
      ratingCount: 2100,
      customisable: false,
      category: 'Drinks',
      tag: 'Chilled Shake',
      rest: "Garden Bakery & Fast Food",
      img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'extra-brownie-crust', name: 'Extra Brownie Chunk on Top', price: 30 }
      ]
    },

    // --- 4. Royal Dawat & Forno d'Oro (Medchal Highway / Kompally-Dulapally Hub) ---
    {
      id: 'chicken-biryani',
      restaurantId: 'royal-dawat-forno',
      name: 'Chicken Dum Biryani',
      desc: 'Fragrant aged basmati rice cooked on slow dum with tender spiced chicken, saffron, caramelised onions, and fresh mint.',
      price: 249,
      veg: false,
      rating: 4.8,
      ratingCount: 1840,
      customisable: true,
      category: 'Biryani',
      tag: 'Bestseller',
      rest: "Royal Dawat & Forno d'Oro",
      img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'extra-chicken', name: 'Extra Spiced Chicken Pieces', price: 80 },
        { id: 'extra-egg', name: 'Farm-Fresh Boiled Egg (1 pc)', price: 20 },
        { id: 'extra-raita', name: 'Burani Garlic Raita Cup', price: 30 },
        { id: 'mirchi-salan', name: 'Hyderabadi Mirchi Ka Salan', price: 40 }
      ],
      options: [
        { name: 'Spice Level', choices: ['Medium Spice', 'Mild', 'Extra Spicy (Andhra Style)'] },
        { name: 'Portion Size', choices: ['Regular (Serves 1)', 'Large (Serves 2, +₹140)'] }
      ]
    },
    {
      id: 'veg-manchuria',
      restaurantId: 'royal-dawat-forno',
      name: 'Crispy Veg Manchuria',
      desc: 'Golden minced vegetable dumplings wok-tossed in dark soy sauce, crushed ginger, green chillies, and spring onion greens.',
      price: 180,
      veg: true,
      rating: 4.6,
      ratingCount: 920,
      customisable: true,
      category: 'Starters',
      tag: 'Popular',
      rest: "Royal Dawat & Forno d'Oro",
      img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'extra-schezwan', name: 'Fiery Schezwan Dip', price: 25 },
        { id: 'crispy-garlic', name: 'Fried Garlic Crunch Topping', price: 20 },
        { id: 'fried-noodles', name: 'Crispy Fried Wonton Strips', price: 30 }
      ],
      options: [
        { name: 'Preparation', choices: ['Dry (Appetizer Style)', 'Gravy (Saucy)'] }
      ]
    },
    {
      id: 'paneer-butter-masala',
      restaurantId: 'royal-dawat-forno',
      name: 'Paneer Butter Masala',
      desc: 'Velvety curd-marinated malai paneer simmered in slow-roasted vine tomato gravy enriched with fresh cream and butter.',
      price: 279,
      veg: true,
      rating: 4.7,
      ratingCount: 1120,
      customisable: true,
      category: 'Main Course',
      tag: 'Chef Pick',
      rest: "Royal Dawat & Forno d'Oro",
      img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'extra-paneer', name: 'Extra Malai Paneer Cubes', price: 50 },
        { id: 'extra-butter', name: 'Amul Butter Dollop', price: 25 },
        { id: 'roast-cashews', name: 'Roasted Golden Cashews', price: 40 }
      ],
      options: [
        { name: 'Spice Level', choices: ['Mild & Creamy', 'Medium Spice'] }
      ]
    },
    {
      id: 'garlic-butter-naan',
      restaurantId: 'royal-dawat-forno',
      name: 'Garlic Butter Naan (2 Pcs)',
      desc: 'Tandoor-charred leavened flatbreads generously brushed with roasted garlic paste, melted butter, and fresh coriander.',
      price: 79,
      veg: true,
      rating: 4.9,
      ratingCount: 3100,
      customisable: false,
      category: 'Breads',
      tag: 'Must Try',
      rest: "Royal Dawat & Forno d'Oro",
      img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'cheese-stuffing', name: 'Add Melted Cheese Stuffing', price: 40 }
      ]
    },
    {
      id: 'burrata-pugliese',
      restaurantId: 'royal-dawat-forno',
      name: 'Burrata Pugliese Woodfired Pizza',
      desc: 'San Marzano DOP crushed sauce, whole artisanal Puglia burrata, sun-blushed heirloom tomatoes, and wild basil on 48hr sourdough.',
      price: 549,
      veg: true,
      rating: 4.9,
      ratingCount: 1420,
      customisable: true,
      category: 'Main Course',
      tag: 'Artisanal Pick',
      rest: "Royal Dawat & Forno d'Oro",
      img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'extra-burrata', name: 'Extra Whole Burrata Crown', price: 90 },
        { id: 'black-truffle-oil', name: 'Umbrian Black Truffle Oil', price: 50 },
        { id: 'wild-arugula', name: 'Aged Balsamic Wild Rocket', price: 35 }
      ],
      options: [
        { name: 'Crust Type', choices: ['48hr Neapolitan Sourdough', 'Thin & Crispy Roman Crust'] }
      ]
    },
    {
      id: 'wagyu-truffle-pizza',
      restaurantId: 'royal-dawat-forno',
      name: 'Truffle Wagyu Bresaola Pizza',
      desc: 'Fior di latte, cured wagyu bresaola, black summer truffle carpaccio, wild arugula, and 24-month parmigiano reggiano.',
      price: 649,
      veg: false,
      rating: 4.9,
      ratingCount: 880,
      customisable: true,
      category: 'Main Course',
      tag: 'Gourmet Gold',
      rest: "Royal Dawat & Forno d'Oro",
      img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'extra-bresaola', name: 'Extra Cured Wagyu Bresaola', price: 120 },
        { id: 'shaved-parm', name: '24-Month Parmigiano Shavings', price: 50 }
      ],
      options: [
        { name: 'Crust Type', choices: ['48hr Neapolitan Sourdough', 'Gluten-Free Cauliflower Crust (+₹80)'] }
      ]
    },
    {
      id: 'gulab-jamun-rabdi',
      restaurantId: 'royal-dawat-forno',
      name: 'Hot Gulab Jamun with Malai Rabdi',
      desc: 'Two golden khoya jamuns soaked in warm saffron-cardamom nectar, served with chilled slow-cooked malai rabdi.',
      price: 149,
      veg: true,
      rating: 4.8,
      ratingCount: 1640,
      customisable: false,
      category: 'Desserts',
      tag: 'Sweet Tooth',
      rest: "Royal Dawat & Forno d'Oro",
      img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'extra-rabdi', name: 'Extra Kesar Rabdi Cup', price: 40 },
        { id: 'pista-topping', name: 'Roasted Iranian Pistachios', price: 25 }
      ]
    },
    {
      id: 'kesar-mango-lassi',
      restaurantId: 'royal-dawat-forno',
      name: 'Alphonso Kesar Mango Lassi',
      desc: 'Thick farm curd whipped with pure Ratnagiri Alphonso mango pulp, saffron threads, and crushed green cardamom.',
      price: 129,
      veg: true,
      rating: 4.9,
      ratingCount: 2200,
      customisable: false,
      category: 'Drinks',
      tag: 'Refreshing',
      rest: "Royal Dawat & Forno d'Oro",
      img: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=800&auto=format&fit=crop&q=80',
      addons: [
        { id: 'dry-fruits-topping', name: 'Royal Dry Fruit Mix (Badam, Pista)', price: 30 }
      ]
    },
    {
      id: 'tender-coconut-mint',
      restaurantId: 'royal-dawat-forno',
      name: 'Chilled Coconut Water with Mint',
      desc: 'Pure cold-pressed tender coconut water infused with garden mint, rock salt, and tender coconut malai scoops.',
      price: 99,
      veg: true,
      rating: 4.7,
      ratingCount: 650,
      customisable: false,
      category: 'Drinks',
      tag: 'Hydrating',
      rest: "Royal Dawat & Forno d'Oro",
      img: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=800&auto=format&fit=crop&q=80',
      addons: []
    }
  ];

  // Active Restaurant & Multi-Restaurant Catalog for Maisammaguda, Dulapally (500100)
  const ACTIVE_REST_KEY = 'deliverapp_active_restaurant_v2';

  window.RESTAURANTS = [
    {
      id: 'lazeez-mandi',
      name: "Lazeez Arabian Mandi & Shawarma",
      tagline: "Authentic Arabian Mandi, Al-Faham, Rumali Shawarma & Kunafa",
      cuisine: "Arabian • Mandi • Shawarma • BBQ Platters",
      rating: 4.8,
      reviewsCount: 1950,
      deliveryTime: "20–25 min",
      priceRange: "₹₹",
      distance: "0.8 km away (Maisammaguda)",
      deliveryFee: "Free on orders above ₹199",
      coverImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80",
      address: "Opposite Malla Reddy University Campus, Maisammaguda, Dulapally, Hyderabad 500100",
      phone: "+91 98480 77123",
      fssai: "13623014000881",
      lat: 17.5628,
      lng: 78.4545,
      offers: [
        { code: "MANDI50", title: "Flat ₹50 OFF", desc: "Use code MANDI50 on orders above ₹199", minOrder: 199, discount: 50, type: 'flat' },
        { code: "LAZEEZ20", title: "20% OFF up to ₹120", desc: "Use code LAZEEZ20 on orders above ₹249", minOrder: 249, discount: 0.20, maxDiscount: 120, type: 'percent' },
        { code: "WELCOME100", title: "Flat ₹100 OFF First Order", desc: "Use code WELCOME100 on orders above ₹399", minOrder: 399, discount: 100, type: 'flat' }
      ],
      reviews: [
        { author: "Karthik Varma (MRUH Student)", rating: 5, date: "Yesterday", text: "Best Mutton Mandi in Maisammaguda! The meat was fall-apart tender and the tomato soup was amazing.", tags: ["Taste", "Mandi Quality"] },
        { author: "Sneha Patil", rating: 5, date: "2 days ago", text: "Special Rumali Shawarma is unbeatable near Malla Reddy campus. Super fast delivery in 18 mins!", tags: ["Speed", "Portion"] },
        { author: "Mohammed Bilal", rating: 5, date: "5 days ago", text: "The Al-Faham chicken is charred to perfection with genuine Arabian spices. Great portion size.", tags: ["Charcoal Flavor"] }
      ]
    },
    {
      id: 'my-village-kitchen',
      name: "My Village Kitchen",
      tagline: "Authentic Telangana Ruchulu, Bamboo Specials & Clay Pot Biryani",
      cuisine: "Telangana • Rayalaseema • Bamboo Specials • Biryani",
      rating: 4.7,
      reviewsCount: 1430,
      deliveryTime: "25–30 min",
      priceRange: "₹₹",
      distance: "1.1 km away (Dulapally Rd)",
      deliveryFee: "Free on orders above ₹199",
      coverImage: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=1200&auto=format&fit=crop&q=80",
      address: "Dulapally Cross Road, Maisammaguda, Hyderabad, Telangana 500100",
      phone: "+91 98480 33456",
      fssai: "13621014000319",
      lat: 17.5635,
      lng: 78.4560,
      offers: [
        { code: "VILLAGE40", title: "Flat ₹40 OFF", desc: "Use code VILLAGE40 on orders above ₹199", minOrder: 199, discount: 40, type: 'flat' },
        { code: "EPICURE20", title: "20% OFF up to ₹149", desc: "Use code EPICURE20 on orders above ₹299", minOrder: 299, discount: 0.20, maxDiscount: 149, type: 'percent' },
        { code: "WELCOME100", title: "Flat ₹100 OFF First Order", desc: "Use code WELCOME100 on orders above ₹399", minOrder: 399, discount: 100, type: 'flat' }
      ],
      reviews: [
        { author: "Sai Teja", rating: 5, date: "Yesterday", text: "Natu Kodi Pulao is pure bliss! Real country chicken flavor with the right spice punch.", tags: ["Authentic Spice", "Hot Delivery"] },
        { author: "Ramesh Goud", rating: 5, date: "4 days ago", text: "The Bamboo Chicken is a must-try here. Very smoky, tender and zero excess oil.", tags: ["Bamboo Special"] },
        { author: "Divya N", rating: 4, date: "1 week ago", text: "Ulavacharu Biryani had that distinct authentic sour and spicy Andhra taste. Loved the packaging.", tags: ["Traditional Taste"] }
      ]
    },
    {
      id: 'royal-dawat-forno',
      name: "Royal Dawat & Forno d'Oro",
      tagline: "Hyderabadi Dum Biryani, Indo-Chinese & Stone-oven Neapolitan Pizzas",
      cuisine: "North Indian • Biryani • Chinese • Artisanal Italian",
      rating: 4.8,
      reviewsCount: 2450,
      deliveryTime: "25–30 min",
      priceRange: "₹₹",
      distance: "1.2 km away (Kompally - Dulapally)",
      deliveryFee: "Free on orders above ₹199",
      coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80",
      address: "Medchal Highway, Kompally - Dulapally Road, Hyderabad 500100",
      phone: "+91 98470 54321",
      fssai: "13622014000492",
      lat: 17.55714,
      lng: 78.44987,
      offers: [
        { code: "FEAST50", title: "Flat ₹50 OFF", desc: "Use code FEAST50 on orders above ₹199", minOrder: 199, discount: 50, type: 'flat' },
        { code: "EPICURE20", title: "20% OFF up to ₹149", desc: "Use code EPICURE20 on orders above ₹299", minOrder: 299, discount: 0.20, maxDiscount: 149, type: 'percent' },
        { code: "WELCOME100", title: "Flat ₹100 OFF First Order", desc: "Use code WELCOME100 on orders above ₹399", minOrder: 399, discount: 100, type: 'flat' }
      ],
      reviews: [
        { author: "Ananya Rao", rating: 5, date: "Yesterday", text: "The Chicken Dum Biryani was exceptionally fragrant and the burrata pizza had the perfect charred crust!", tags: ["Food Quality", "Packaging"] },
        { author: "Vikram Reddy", rating: 5, date: "3 days ago", text: "Delivered in just 22 minutes to Kompally. The food arrived piping hot in thermal insulation.", tags: ["Speed", "Taste"] },
        { author: "Pooja Sharma", rating: 4, date: "1 week ago", text: "Loved the Veg Manchuria and Paneer Butter Masala with the Garlic Naan. Generous portions.", tags: ["Value for Money"] }
      ]
    },
    {
      id: 'garden-bakery',
      name: "Garden Bakery & Fast Food",
      tagline: "Fresh rolls, loaded burgers, thick shakes & quick bites",
      cuisine: "Fast Food • Rolls • Burgers • Shakes",
      rating: 4.6,
      reviewsCount: 980,
      deliveryTime: "15–20 min",
      priceRange: "₹",
      distance: "0.5 km away (Maisammaguda College Road)",
      deliveryFee: "Free on orders above ₹149",
      coverImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&auto=format&fit=crop&q=80",
      address: "St. Peter’s & Malla Reddy College Road, Maisammaguda, Dulapally 500100",
      phone: "+91 98480 88990",
      fssai: "13622014000101",
      lat: 17.5615,
      lng: 78.4510,
      offers: [
        { code: "SNACK30", title: "Flat ₹30 OFF", desc: "Use code SNACK30 on orders above ₹149", minOrder: 149, discount: 30, type: 'flat' }
      ],
      reviews: [
        { author: "Deepak Ch", rating: 5, date: "3 days ago", text: "Chicken 65 roll and Nutella shake are student lifesavers between classes!", tags: ["Affordable", "Taste"] }
      ]
    }
  ];

  window.getActiveRestaurant = function() {
    // Check URL search param first, then localStorage, then default to 'lazeez-mandi'
    try {
      const p = new URLSearchParams(window.location.search);
      const urlId = p.get('id') || p.get('rest');
      if (urlId) {
        const foundUrl = window.RESTAURANTS.find(r => r.id === urlId);
        if (foundUrl) {
          writeStorage(ACTIVE_REST_KEY, urlId);
          return foundUrl;
        }
      }
    } catch(e) {}

    const savedId = readStorage(ACTIVE_REST_KEY, 'lazeez-mandi');
    return window.RESTAURANTS.find(r => r.id === savedId) || window.RESTAURANTS[0];
  };

  window.setActiveRestaurant = function(id) {
    const found = window.RESTAURANTS.find(r => r.id === id);
    if (found) {
      writeStorage(ACTIVE_REST_KEY, id);
      window.RESTAURANT = found;
      window.dispatchEvent(new CustomEvent('restaurant:change', { detail: found }));
    }
    return found;
  };

  window.getMenuItems = function(restId) {
    if (!restId) restId = (window.RESTAURANT ? window.RESTAURANT.id : 'lazeez-mandi');
    return window.MENU.filter(item => item.restaurantId === restId || item.rest === (window.RESTAURANT && window.RESTAURANT.name));
  };

  // Active Restaurant Metadata
  window.RESTAURANT = window.getActiveRestaurant();

  // Coupons Manager
  window.Coupons = {
    list() {
      return window.RESTAURANT.offers;
    },
    active() {
      return readStorage(ACTIVE_COUPON_KEY, { code: 'FEAST50', discount: 50, type: 'flat', minOrder: 199 });
    },
    apply(code) {
      const c = this.list().find(x => x.code.toUpperCase() === code.toUpperCase());
      if (!c) return { success: false, message: 'Invalid promo code' };
      writeStorage(ACTIVE_COUPON_KEY, c);
      window.dispatchEvent(new CustomEvent('coupon:applied', { detail: c }));
      return { success: true, coupon: c };
    },
    remove() {
      localStorage.removeItem(ACTIVE_COUPON_KEY);
      window.dispatchEvent(new CustomEvent('coupon:removed'));
    }
  };

  // Saved Addresses Manager
  const DEFAULT_SAVED_ADDRESSES = [
    {
      id: 'addr-home',
      tag: 'HOME',
      name: 'Aarav Mehta',
      phone: '+91 98470 88990',
      house: 'Flat 302, Green Meadows Apts',
      street: 'Kompally Main Road, Medchal Highway',
      area: 'Kompally',
      landmark: 'Near Cineplanet Multiplex',
      city: 'Hyderabad',
      state: 'Telangana',
      pin: '500100',
      instructions: 'Leave at front door and ring doorbell once',
      latitude: 17.55714,
      longitude: 78.44987,
      isDefault: true
    },
    {
      id: 'addr-work',
      tag: 'WORK',
      name: 'Aarav Mehta',
      phone: '+91 98470 88990',
      house: 'Building 12B, 4th Floor',
      street: 'Mindspace Cyber City, Madhapur',
      area: 'Hitec City',
      landmark: 'Next to Westin Hotel',
      city: 'Hyderabad',
      state: 'Telangana',
      pin: '500081',
      instructions: 'Deliver to security desk on ground floor',
      latitude: 17.4435,
      longitude: 78.3772,
      isDefault: false
    },
    {
      id: 'addr-other',
      tag: 'OTHER',
      name: 'Aarav Mehta',
      phone: '+91 98470 88990',
      house: 'Villa 18, Lakeview Enclave',
      street: 'Dulapally Road',
      area: 'Dulapally, Medchal',
      landmark: 'Near Forest Academy',
      city: 'Hyderabad',
      state: 'Telangana',
      pin: '500100',
      instructions: 'Call upon gate arrival',
      latitude: 17.5645,
      longitude: 78.4570,
      isDefault: false
    }
  ];

  window.SavedAddresses = {
    all() {
      return readStorage(SAVED_ADDR_KEY, DEFAULT_SAVED_ADDRESSES);
    },
    get(id) {
      return this.all().find(a => a.id === id) || this.selected();
    },
    selected() {
      const list = this.all();
      const selId = readStorage(ADDR_KEY, null);
      let sel = null;
      if (selId && typeof selId === 'string') {
        sel = list.find(a => a.id === selId);
      }
      if (!sel) {
        sel = list.find(a => a.isDefault) || list[0] || DEFAULT_SAVED_ADDRESSES[0];
      }
      if (sel && typeof sel.label === 'string' && sel.label.includes('undefined')) {
        sel.label = sel.label.replace(/•\s*undefined/g, '• Kompally').replace(/undefined/g, 'Kompally');
      }
      if (sel && !sel.house && sel.street) {
        sel.house = sel.street;
      }
      return sel;
    },
    select(id) {
      writeStorage(ADDR_KEY, id);
      const sel = this.get(id);
      window.dispatchEvent(new CustomEvent('address:change', { detail: sel }));
      return sel;
    },
    save(newAddr) {
      const list = this.all();
      if (!newAddr.id) {
        newAddr.id = 'addr-' + Date.now().toString(36);
      }
      if (!newAddr.house && newAddr.street) {
        newAddr.house = newAddr.street;
      }
      const idx = list.findIndex(a => a.id === newAddr.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...newAddr };
      } else {
        list.push(newAddr);
      }
      writeStorage(SAVED_ADDR_KEY, list);
      this.select(newAddr.id);
      return newAddr;
    },
    delete(id) {
      let list = this.all().filter(a => a.id !== id);
      if (list.length === 0) list = DEFAULT_SAVED_ADDRESSES;
      writeStorage(SAVED_ADDR_KEY, list);
      this.select(list[0].id);
      return list;
    }
  };

  // Backwards-compatible alias for existing header bindings
  window.DeliveryAddress = {
    get() {
      const sel = window.SavedAddresses.selected() || {};
      const houseStr = sel.house ? `${sel.house}, ` : '';
      const areaStr = sel.area || sel.street || 'Kompally';
      const tagStr = sel.tag ? `${sel.tag} • ` : '';

      let computedLabel = '';
      if (sel.label && !sel.label.includes('undefined')) {
        computedLabel = sel.tag && !sel.label.startsWith(sel.tag)
          ? `${sel.tag} • ${sel.label}`
          : sel.label;
      } else {
        computedLabel = `${tagStr}${houseStr}${areaStr}`;
      }

      computedLabel = computedLabel.replace(/•\s*undefined/g, '• Kompally').replace(/undefined/g, 'Kompally').trim();

      return {
        id: sel.id || 'addr-default',
        label: computedLabel,
        house: sel.house || sel.street || 'Flat 302, Green Meadows Apts',
        street: sel.street || 'Kompally Main Road',
        area: sel.area || 'Kompally',
        city: `${sel.city || 'Hyderabad'}, ${sel.state || 'Telangana'} ${sel.pin || '500100'}`.trim(),
        tag: sel.tag || 'Home',
        phone: sel.phone || '+91 98470 88990',
        instructions: sel.instructions || '',
        latitude: sel.latitude || 17.55714,
        longitude: sel.longitude || 78.44987
      };
    },
    save(a) {
      return window.SavedAddresses.save(a);
    }
  };

  // Unified Cart Engine
  window.Cart = {
    get() {
      return readStorage(CART_KEY, []);
    },
    save(cart) {
      writeStorage(CART_KEY, cart);
      const evt = new CustomEvent('cart:update', { detail: cart });
      window.dispatchEvent(evt);
      if (window.parent && window.parent !== window) {
        try { window.parent.dispatchEvent(new CustomEvent('cart:update', { detail: cart })); } catch(e) {}
        try { window.parent.postMessage({ type: 'cart:update', cart }, '*'); } catch(e) {}
      }
      if (window.top && window.top !== window && window.top !== window.parent) {
        try { window.top.dispatchEvent(new CustomEvent('cart:update', { detail: cart })); } catch(e) {}
        try { window.top.postMessage({ type: 'cart:update', cart }, '*'); } catch(e) {}
      }
      try {
        const frame = document.getElementById('appFrame');
        if (frame && frame.contentWindow) {
          frame.contentWindow.dispatchEvent(new CustomEvent('cart:update', { detail: cart }));
          frame.contentWindow.postMessage({ type: 'cart:update', cart }, '*');
        }
      } catch(e) {}
    },
    add(itemId, qty = 1, options = {}, addons = []) {
      const cart = this.get();
      const menu = window.MENU.find(m => m.id === itemId);
      if (!menu) return cart;

      const addonsKey = (addons || []).map(a => a.id).sort().join('|');
      const optionsKey = JSON.stringify(options || {});
      const existing = cart.find(i => i.id === itemId && (i.addonsKey || '') === addonsKey && (i.optionsKey || '') === optionsKey);

      const addonTotal = (addons || []).reduce((s, a) => s + (a.price || 0), 0);
      const unitPrice = menu.price + addonTotal;

      if (existing) {
        existing.qty = Math.max(0, (+existing.qty || 0) + (+qty || 1));
      } else {
        cart.push({
          cartKey: itemId + '-' + Date.now().toString(36),
          id: menu.id,
          name: menu.name,
          desc: menu.desc,
          basePrice: menu.price,
          price: unitPrice,
          qty: Math.max(1, +qty || 1),
          veg: menu.veg,
          img: menu.img,
          category: menu.category,
          rest: menu.rest,
          addons: addons || [],
          addonsKey,
          options: options || {},
          optionsKey
        });
      }
      this.save(cart);
      return cart;
    },
    setQty(cartKeyOrId, qty) {
      let cart = this.get();
      const nQty = Math.max(0, +qty || 0);
      if (nQty <= 0) {
        cart = cart.filter(i => i.cartKey !== cartKeyOrId && i.id !== cartKeyOrId);
      } else {
        const found = cart.find(i => i.cartKey === cartKeyOrId || i.id === cartKeyOrId);
        if (found) {
          found.qty = nQty;
        }
      }
      this.save(cart);
      return cart;
    },
    getItem(itemId) {
      return this.get().find(i => i.id === itemId || i.cartKey === itemId);
    },
    clear() {
      this.save([]);
    },
    count() {
      return this.get().reduce((sum, i) => sum + (+i.qty || 0), 0);
    },
    subtotal() {
      return this.get().reduce((sum, i) => sum + (+i.price || 0) * (+i.qty || 0), 0);
    },
    bill() {
      const sub = this.subtotal();
      if (sub === 0) {
        return { sub: 0, discount: 0, delivery: 0, platform: 0, tax: 0, tip: 0, total: 0, coupon: null };
      }

      const activeCoupon = window.Coupons.active();
      let discount = 0;
      if (activeCoupon && sub >= (activeCoupon.minOrder || 0)) {
        if (activeCoupon.type === 'flat') {
          discount = activeCoupon.discount;
        } else if (activeCoupon.type === 'percent') {
          const calc = Math.round(sub * activeCoupon.discount);
          discount = Math.min(calc, activeCoupon.maxDiscount || 999);
        }
      }

      // Standard Indian Food Delivery Fee Architecture
      const delivery = sub >= 199 ? 0 : 30; // Free delivery over ₹199
      const platform = 5; // Standard ₹5 platform fee
      const tax = Math.round(sub * 0.05); // 5% GST on Restaurant Services
      const tip = 0;
      const total = Math.max(0, Math.round(sub - discount + delivery + platform + tax + tip));

      return {
        sub: Math.round(sub),
        discount: Math.round(discount),
        delivery,
        platform,
        tax,
        tip,
        total,
        coupon: discount > 0 ? activeCoupon : null
      };
    }
  };

  // 7 Real-time Tracking States
  window.TRACKING_STATES = [
    {
      id: 1,
      key: 'placed',
      title: 'Order Placed',
      sub: 'Your order has been sent to the restaurant.',
      icon: 'receipt',
      color: 'text-tertiary',
      badge: 'bg-tertiary-fixed text-on-tertiary-fixed',
      eta: '30–35 min',
      progressPct: 15
    },
    {
      id: 2,
      key: 'confirmed',
      title: 'Restaurant Confirmed',
      sub: 'The restaurant has accepted your order.',
      icon: 'thumb_up',
      color: 'text-tertiary',
      badge: 'bg-tertiary-fixed text-on-tertiary-fixed',
      eta: '25–28 min',
      progressPct: 32
    },
    {
      id: 3,
      key: 'preparing',
      title: 'Food Preparing',
      sub: 'Your food is being freshly prepared in the kitchen.',
      icon: 'skillet',
      color: 'text-primary',
      badge: 'bg-primary-fixed text-on-primary-fixed',
      eta: '20–22 min',
      progressPct: 50
    },
    {
      id: 4,
      key: 'ready',
      title: 'Ready for Pickup',
      sub: 'Your order is boxed in thermo-wrap and ready.',
      icon: 'inventory_2',
      color: 'text-primary',
      badge: 'bg-primary-fixed text-on-primary-fixed',
      eta: '16–18 min',
      progressPct: 65
    },
    {
      id: 5,
      key: 'assigned',
      title: 'Delivery Partner Assigned',
      sub: 'Rahul is at the restaurant picking up your order.',
      icon: 'person_pin_circle',
      color: 'text-primary',
      badge: 'bg-primary-fixed text-on-primary-fixed',
      eta: '14–16 min',
      progressPct: 78
    },
    {
      id: 6,
      key: 'out_for_delivery',
      title: 'Out for Delivery',
      sub: 'Rahul is on the way heading towards Kompally.',
      icon: 'electric_moped',
      color: 'text-primary',
      badge: 'bg-primary-fixed text-on-primary-fixed',
      eta: '10–12 min',
      progressPct: 90
    },
    {
      id: 7,
      key: 'delivered',
      title: 'Delivered',
      sub: 'Enjoy your meal! Please rate your culinary experience.',
      icon: 'task_alt',
      color: 'text-tertiary',
      badge: 'bg-tertiary text-white',
      eta: 'Delivered',
      progressPct: 100
    }
  ];

  // Orders Management Engine
  window.Orders = {
    all() {
      return readStorage(ORDER_KEY, []);
    },
    get(id) {
      return this.all().find(o => o.id === id);
    },
    active() {
      const all = this.all();
      const activeOrder = all.find(o => o.status !== 'delivered');
      if (activeOrder) return activeOrder;
      const last = all[0];
      return last || null;
    },
    create({ items, bill, address, payment }) {
      const orders = this.all();
      const currentAddress = address || window.DeliveryAddress.get();
      const order = {
        id: '123' + Math.floor(10 + Math.random() * 90),
        items: items || window.Cart.get(),
        bill: bill || window.Cart.bill(),
        address: currentAddress,
        payment: payment || { method: 'UPI', id: 'upi_pay_' + Date.now().toString(36), status: 'success' },
        status: 'out_for_delivery',
        stateStep: 6,
        placedAt: Date.now(),
        etaMin: 18,
        rider: {
          name: 'Rahul V.',
          phone: '+91 98470 12345',
          rating: 4.8,
          deliveries: '1,420+ deliveries',
          vehicle: 'Electric Vespa • TS-08-EK-5012',
          image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
        },
        restaurant: {
          name: window.RESTAURANT.name,
          address: window.RESTAURANT.address,
          phone: window.RESTAURANT.phone
        },
        review: null
      };

      orders.unshift(order);
      writeStorage(ORDER_KEY, orders);
      writeStorage('deliverapp_active_order_id', order.id);
      window.dispatchEvent(new CustomEvent('orders:updated', { detail: order }));
      return order;
    },
    updateState(orderId, stateStep) {
      const orders = this.all();
      const order = orders.find(o => o.id === orderId);
      if (!order) return null;

      const stepObj = window.TRACKING_STATES.find(s => s.id === stateStep) || window.TRACKING_STATES[0];
      order.stateStep = stepObj.id;
      order.status = stepObj.key;
      order.statusText = stepObj.title;

      writeStorage(ORDER_KEY, orders);
      window.dispatchEvent(new CustomEvent('orders:state_changed', { detail: { order, step: stepObj } }));
      return order;
    },
    submitReview(orderId, { restaurantRating, deliveryRating, reviewText, tags }) {
      const orders = this.all();
      const order = orders.find(o => o.id === orderId);
      const reviewObj = {
        orderId,
        restaurantRating: restaurantRating || 5,
        deliveryRating: deliveryRating || 5,
        reviewText: reviewText || '',
        tags: tags || [],
        submittedAt: Date.now()
      };
      if (order) {
        order.review = reviewObj;
        writeStorage(ORDER_KEY, orders);
      }
      const reviews = readStorage(REVIEWS_KEY, []);
      reviews.unshift(reviewObj);
      writeStorage(REVIEWS_KEY, reviews);
      window.dispatchEvent(new CustomEvent('review:submitted', { detail: reviewObj }));
      return reviewObj;
    },
    reorder(orderId) {
      const order = this.get(orderId);
      if (!order || !order.items) return false;
      window.Cart.clear();
      order.items.forEach(item => {
        window.Cart.add(item.id, item.qty, item.options, item.addons);
      });
      return true;
    }
  };

  // User begins with an empty cart. "View Bag" will only appear when user adds items,
  // and will disappear as soon as user removes them.

  // Seed default active order if none exists (using standalone sample items so Cart is kept untouched)
  if (window.Orders.all().length === 0) {
    window.Orders.create({
      items: [
        {
          id: 'juicy-mutton-mandi',
          name: 'Juicy Mutton Mandi',
          price: 380,
          qty: 1,
          veg: false,
          img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
          rest: 'Lazeez Arabian Mandi & Shawarma'
        },
        {
          id: 'rumali-chicken-shawarma',
          name: 'Special Rumali Chicken Shawarma',
          price: 130,
          qty: 1,
          veg: false,
          img: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=80',
          rest: 'Lazeez Arabian Mandi & Shawarma'
        }
      ],
      bill: { sub: 510, discount: 0, delivery: 0, platform: 5, tax: 26, total: 541 },
      address: window.DeliveryAddress.get(),
      payment: { method: 'UPI', id: 'upi_pay_live_7891', status: 'success' }
    });
  }
})();
