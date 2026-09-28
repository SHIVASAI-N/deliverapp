import {
  IUser,
  IAddress,
  IRestaurant,
  IMenuItem,
  IOrder,
  OrderStatus,
  IRider,
  IPaymentIntent
} from '@deliverapp/types';

export class DatabaseService {
  private static instance: DatabaseService;

  public users: Map<string, IUser> = new Map();
  public addresses: Map<string, IAddress> = new Map();
  public restaurants: Map<string, IRestaurant> = new Map();
  public menuItems: Map<string, IMenuItem> = new Map();
  public orders: Map<string, IOrder> = new Map();
  public riders: Map<string, IRider> = new Map();
  public paymentIntents: Map<string, IPaymentIntent> = new Map();
  public riderHotLocations: Map<string, { latitude: number; longitude: number; timestamp: number }> = new Map();

  private constructor() {
    this.seedInitialData();
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private seedInitialData() {
    // 1. Seed Customer
    const user: IUser = {
      id: 'usr_aarav',
      phone: '+919847088990',
      name: 'Aarav Mehta',
      email: 'aarav.mehta@epicurean.internal',
      role: 'CUSTOMER',
      isGoldMember: true,
      addresses: [],
      createdAt: new Date().toISOString()
    };
    this.users.set(user.id, user);
    this.users.set(user.phone, user);

    const address: IAddress = {
      id: 'addr_1',
      userId: user.id,
      tag: 'HOME',
      label: '42 Artisan Row, Apt 4B',
      street: 'Napier Street, Heritage Quarters',
      area: 'Fort Kochi',
      city: 'Kochi, Kerala',
      postalCode: '682001',
      latitude: 9.9275,
      longitude: 76.2600,
      isDefault: true
    };
    this.addresses.set(address.id, address);
    user.addresses.push(address);

    // 2. Seed Restaurants
    const fornoDoro: IRestaurant = {
      id: 'rest_forno_doro',
      name: "Forno d'Oro Trattoria",
      tagline: 'Authentic stone-oven Neapolitan sourdough & handcrafted burrata',
      cuisine: ['Neapolitan Pizza', 'Handmade Pasta', 'Antipasti'],
      rating: 4.9,
      totalReviews: 1240,
      avgPreparationMinutes: 20,
      deliveryTimeEstimate: '25-30 mins',
      distanceKm: 1.2,
      pureVeg: false,
      isOpen: true,
      heroImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgROpqTNLW_NP9KDxQULsJ9rQ4pBcHtQPr67slTutYC47YlCSYOEFcyfMdQzDxCtLkE_NSsg3w8e6m6taMlfbK-DjkZNolzEN5CLno3x1H7dZ1-iZqVcHj5Gg8mwn-N0Nzy1dTGPaYoLESGgKlXARR8fCXsJgRWDuTnLpJI5ycfXKyhFmeprXmeI4FOoi19ND_A10o_v9Ow5JO5ZOVtpmEipGrfUgRbYDU9Mq_eJJgqCd9LhRs_gXl',
      address: {
        street: 'Heritage Quarters',
        area: 'Fort Kochi',
        city: 'Kochi, Kerala',
        latitude: 9.9350,
        longitude: 76.2710
      },
      contactPhone: '+919847054321',
      categories: [
        {
          id: 'cat_pizzas',
          restaurantId: 'rest_forno_doro',
          name: 'Woodfired Sourdough Pizzas',
          sortOrder: 1,
          items: []
        },
        {
          id: 'cat_antipasti',
          restaurantId: 'rest_forno_doro',
          name: 'Artisanal Antipasti',
          sortOrder: 2,
          items: []
        }
      ]
    };
    this.restaurants.set(fornoDoro.id, fornoDoro);

    const burgerCo: IRestaurant = {
      id: 'rest_atelier_burger',
      name: 'Atelier Burger Co.',
      tagline: 'Dry-aged prime wagyu blends & truffle aioli brioche melts',
      cuisine: ['Artisanal Burgers', 'Sides', 'Craft Shakes'],
      rating: 4.8,
      totalReviews: 890,
      avgPreparationMinutes: 18,
      deliveryTimeEstimate: '20-25 mins',
      distanceKm: 2.1,
      pureVeg: false,
      isOpen: true,
      heroImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFQaGHEyHTyh5wOPOx-oI7QqZKOZ5fHovhPiRPEpToZWdQyvpcFnbWcuOhO3pJDVqHxJt6c3YkU2h0ofoNn1ZJozKo4M1uaPE1WuRDhK3oG3nXzd10bGlbB4UZEiBj6bTcuihrf_Oq7kPf9JNS7SF0AC1NhSPLGHBgtiOY1Fo1TUOz9oIjz_ItIC9l3pzuyMQnDAcsr8Y6gBQstLdlnoj6V3A2MRKFNfhM3j1QRLXfVwjnPjQec083',
      address: {
        street: 'Princess Street',
        area: 'Fort Kochi',
        city: 'Kochi, Kerala',
        latitude: 9.9290,
        longitude: 76.2640
      },
      contactPhone: '+919847065432'
    };
    this.restaurants.set(burgerCo.id, burgerCo);

    // Maisammaguda, Dulapally 500100 Restaurants
    const lazeezMandi: IRestaurant = {
      id: 'rest_lazeez_mandi',
      name: 'Lazeez Arabian Mandi & Shawarma',
      tagline: 'Authentic Arabian Mandi, Al-Faham, Rumali Shawarma & Kunafa',
      cuisine: ['Arabian', 'Mandi', 'Shawarma', 'BBQ Platters'],
      rating: 4.8,
      totalReviews: 1950,
      avgPreparationMinutes: 18,
      deliveryTimeEstimate: '20-25 mins',
      distanceKm: 0.8,
      pureVeg: false,
      isOpen: true,
      heroImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80',
      address: {
        street: 'Opposite Malla Reddy University Campus',
        area: 'Maisammaguda, Dulapally',
        city: 'Hyderabad, Telangana',
        postalCode: '500100',
        latitude: 17.5628,
        longitude: 78.4545
      },
      contactPhone: '+919848077123',
      categories: [
        {
          id: 'cat_mandi',
          restaurantId: 'rest_lazeez_mandi',
          name: 'Signature Arabian Mandi',
          sortOrder: 1,
          items: []
        },
        {
          id: 'cat_shawarma',
          restaurantId: 'rest_lazeez_mandi',
          name: 'Fresh Rumali Shawarma',
          sortOrder: 2,
          items: []
        }
      ]
    };
    this.restaurants.set(lazeezMandi.id, lazeezMandi);

    const villageKitchen: IRestaurant = {
      id: 'rest_village_kitchen',
      name: 'My Village Kitchen',
      tagline: 'Authentic Telangana Ruchulu, Bamboo Specials & Clay Pot Biryani',
      cuisine: ['Telangana', 'Rayalaseema', 'Bamboo Specials', 'Biryani'],
      rating: 4.7,
      totalReviews: 1430,
      avgPreparationMinutes: 22,
      deliveryTimeEstimate: '25-30 mins',
      distanceKm: 1.1,
      pureVeg: false,
      isOpen: true,
      heroImageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=1200&auto=format&fit=crop&q=80',
      address: {
        street: 'Dulapally Cross Road',
        area: 'Maisammaguda',
        city: 'Hyderabad, Telangana',
        postalCode: '500100',
        latitude: 17.5635,
        longitude: 78.4560
      },
      contactPhone: '+919848033456',
      categories: [
        {
          id: 'cat_village_specials',
          restaurantId: 'rest_village_kitchen',
          name: 'Telangana Village Ruchulu',
          sortOrder: 1,
          items: []
        }
      ]
    };
    this.restaurants.set(villageKitchen.id, villageKitchen);

    // 3. Seed Menu Items
    const dish1: IMenuItem = {
      id: 'item_burrata_pugliese',
      restaurantId: fornoDoro.id,
      categoryId: 'cat_pizzas',
      name: 'Burrata Pugliese Pizza',
      description: 'San Marzano DOP, creamy burrata pugliese, heirloom tomatoes, fresh Genovese basil, cold-pressed olive oil.',
      price: 549,
      isVeg: true,
      isAvailable: true,
      tag: 'Chef Pick',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFQaGHEyHTyh5wOPOx-oI7QqZKOZ5fHovhPiRPEpToZWdQyvpcFnbWcuOhO3pJDVqHxJt6c3YkU2h0ofoNn1ZJozKo4M1uaPE1WuRDhK3oG3nXzd10bGlbB4UZEiBj6bTcuihrf_Oq7kPf9JNS7SF0AC1NhSPLGHBgtiOY1Fo1TUOz9oIjz_ItIC9l3pzuyMQnDAcsr8Y6gBQstLdlnoj6V3A2MRKFNfhM3j1QRLXfVwjnPjQec083',
      optionGroups: [
        {
          id: 'grp_crust',
          title: 'Choose Crust',
          required: true,
          choices: [
            { id: 'crust_classic', name: 'Classic 48hr Neapolitan Sourdough', priceDelta: 0, isDefault: true },
            { id: 'crust_spelt', name: 'Whole Ancient Spelt Crust', priceDelta: 49 },
            { id: 'crust_gluten_friendly', name: 'Gluten-Friendly Chickpea & Rice', priceDelta: 79 }
          ]
        },
        {
          id: 'grp_cheese',
          title: 'Extra Artisanal Cheese',
          required: false,
          choices: [
            { id: 'cheese_extra_burrata', name: 'Double Portion Burrata Pugliese', priceDelta: 129 },
            { id: 'cheese_shaved_parm', name: '24-Mo Aged Parmigiano Reggiano', priceDelta: 79 }
          ]
        }
      ]
    };
    this.menuItems.set(dish1.id, dish1);
    fornoDoro.categories![0].items.push(dish1);

    const dish2: IMenuItem = {
      id: 'item_wagyu_truffle',
      restaurantId: fornoDoro.id,
      categoryId: 'cat_pizzas',
      name: 'Truffle Wagyu Prosciutto Pizza',
      description: 'Fior di latte, cured wagyu bresaola, black summer truffle carpaccio, aged wild arugula, shaved 24-month parmigiano reggiano.',
      price: 649,
      isVeg: false,
      isAvailable: true,
      tag: 'Bestseller',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAvQLSfn0Dp5Nfag2vHUXj5cL2QHBSxQiHGyf54HSlJlRB-TpEg2fQKowKHMnpzAHe7fDUFlJEU6tL50v7E8_G7S7GHo8zTLxJixcrF27B4CmBHu0N_SCLrpO3ovfjV4CS9QvYvEUkUO8POhPUvzRurEMEMnO7ckD7rr3no2xsA_SE2IXhhuPGV58-Dx7Aj_jwpKY8cHOmeDOoOgMOwx8f6HWwY-HlwKTZKIikWjMruE2H4zniyCWA'
    };
    this.menuItems.set(dish2.id, dish2);
    fornoDoro.categories![0].items.push(dish2);

    const dish3: IMenuItem = {
      id: 'item_tomato_tartare',
      restaurantId: fornoDoro.id,
      categoryId: 'cat_antipasti',
      name: 'Heirloom Tomato Tartare',
      description: 'Sun-ripened organic tomatoes finely diced with capers, shallots, whipped sheep milk ricotta, and toasted focaccia crostini.',
      price: 349,
      isVeg: true,
      isAvailable: true,
      tag: 'Appetizer',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6w2R6ZiCEfCg2a01RES6Wdzo7JaL9W6PruXD26nCstrXYYtkcWVJuRcc0eJS45KBrXquKxEz-BRyq6UjsGd6tOrLbeX1An_fPTYP7e-FIhzh7DSvXBWfGhN6gybiTttUv45m9Ew12Q8q77N6UXL0_WM1aWgdMwMFmwvZsVbhbd-T15KZxL7GMTBjKBBIUV1LROu6KAtUQ6KcEVwoHjYQR17tjb5ZI-zdBBTxbsEINKKdyQKrejDld'
    };
    this.menuItems.set(dish3.id, dish3);
    fornoDoro.categories![1].items.push(dish3);

    // Maisammaguda & Dulapally Menu Items
    const mandi1: IMenuItem = {
      id: 'item_juicy_mutton_mandi',
      restaurantId: lazeezMandi.id,
      categoryId: 'cat_mandi',
      name: 'Juicy Mutton Mandi',
      description: 'Tender slow-cooked spiced mutton over aromatic smoked mandi rice with dry fruits, mutton yakhni broth & spicy tomato chutney.',
      price: 380,
      isVeg: false,
      isAvailable: true,
      tag: 'Maisammaguda Bestseller',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
      optionGroups: [
        {
          id: 'grp_portion',
          title: 'Portion Size',
          required: true,
          choices: [
            { id: 'portion_single', name: 'Single (Serves 1)', priceDelta: 0, isDefault: true },
            { id: 'portion_double', name: 'Double Mandi Platter (Serves 2)', priceDelta: 340 }
          ]
        }
      ]
    };
    this.menuItems.set(mandi1.id, mandi1);
    lazeezMandi.categories![0].items.push(mandi1);

    const mandi2: IMenuItem = {
      id: 'item_chicken_alfaham_mandi',
      restaurantId: lazeezMandi.id,
      categoryId: 'cat_mandi',
      name: 'Chicken Al-Faham Mandi',
      description: 'Charcoal flame-grilled spiced chicken quarter over aromatic basmati mandi rice, accompanied by whipped garlic toum dip and soup.',
      price: 260,
      isVeg: false,
      isAvailable: true,
      tag: 'Student Favorite',
      imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&auto=format&fit=crop&q=80'
    };
    this.menuItems.set(mandi2.id, mandi2);
    lazeezMandi.categories![0].items.push(mandi2);

    const mandi3: IMenuItem = {
      id: 'item_rumali_shawarma',
      restaurantId: lazeezMandi.id,
      categoryId: 'cat_shawarma',
      name: 'Special Rumali Chicken Shawarma',
      description: 'Hand-stretched soft rumali roti rolled with spiced shredded roasted chicken, pickled cucumbers, authentic garlic toum & fries.',
      price: 130,
      isVeg: false,
      isAvailable: true,
      tag: 'Campus Hit',
      imageUrl: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=80'
    };
    this.menuItems.set(mandi3.id, mandi3);
    lazeezMandi.categories![1].items.push(mandi3);

    const village1: IMenuItem = {
      id: 'item_natu_kodi_pulao',
      restaurantId: villageKitchen.id,
      categoryId: 'cat_village_specials',
      name: 'Natu Kodi Country Chicken Pulao',
      description: 'Tender country chicken simmered in desi ghee and roasted spices with fragrant Seeraga Samba rice in an earthen handi.',
      price: 299,
      isVeg: false,
      isAvailable: true,
      tag: 'Telangana Special',
      imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80'
    };
    this.menuItems.set(village1.id, village1);
    villageKitchen.categories![0].items.push(village1);

    const village2: IMenuItem = {
      id: 'item_bamboo_chicken',
      restaurantId: villageKitchen.id,
      categoryId: 'cat_village_specials',
      name: 'Wild Charcoal Bamboo Chicken',
      description: 'Marinated spicy chicken stuffed inside forest bamboo shoots and slow-roasted over burning red coals.',
      price: 270,
      isVeg: false,
      isAvailable: true,
      tag: 'Forest Recipe',
      imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80'
    };
    this.menuItems.set(village2.id, village2);
    villageKitchen.categories![0].items.push(village2);

    // 4. Seed Rider
    const rider: IRider = {
      id: 'rider_julian',
      name: 'Julian K.',
      phone: '+919847012345',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXK-nwSjXwQz3PUGZfrl5lGaXGf0ZRfQijBwB3fDVzUBolGHw6OIT5xkzrb8SV6wxwEwluuX0vhv4-xd7gHzp0153653eTjwa9hWZ6mD-J7wUdWcc8ArcqO57SYPUjV1Q801XZhmqS9SYbWyeVrs4dESvUdlsUl-wGVdYUHu__Z11r73f1jf2oDywX0im4XEe8dUbiDIOHG11kUWVe-xxnXX6Mi4jyY3t3uVTb4Pa3Ox8EYXejy6sN',
      vehicleType: 'ELECTRIC_VESPA',
      vehiclePlate: 'KL-07-CK-4290',
      rating: 4.9,
      totalDeliveries: 2420,
      status: 'IDLE',
      currentLocation: {
        riderId: 'rider_julian',
        latitude: 9.9312,
        longitude: 76.2673,
        heading: 45,
        speedKmh: 28,
        batteryLevel: 88,
        timestamp: Date.now()
      }
    };
    this.riders.set(rider.id, rider);
    this.riderHotLocations.set(rider.id, { latitude: 9.9312, longitude: 76.2673, timestamp: Date.now() });

    // 5. Seed an initial active Order
    const order: IOrder = {
      id: 'EP-8241',
      customerId: user.id,
      customerName: user.name!,
      customerPhone: user.phone,
      restaurantId: fornoDoro.id,
      restaurantName: fornoDoro.name,
      riderId: rider.id,
      items: [
        {
          id: 'oi_1',
          menuItemId: dish1.id,
          name: dish1.name,
          unitPrice: dish1.price,
          quantity: 1,
          totalPrice: dish1.price,
          options: [{ name: 'Crust', choice: 'Classic Neapolitan Sourdough', priceDelta: 0 }]
        },
        {
          id: 'oi_2',
          menuItemId: dish2.id,
          name: dish2.name,
          unitPrice: dish2.price,
          quantity: 1,
          totalPrice: dish2.price
        }
      ],
      bill: {
        subtotal: 1198,
        tax: 60,
        deliveryFee: 0,
        riderTip: 50,
        discount: 149,
        couponCode: 'EPICURE20',
        total: 1159
      },
      deliveryAddress: {
        label: address.label,
        street: address.street,
        area: address.area,
        city: address.city,
        latitude: address.latitude,
        longitude: address.longitude,
        instructions: 'Ring bell twice, leave with security'
      },
      status: OrderStatus.OUT_FOR_DELIVERY,
      paymentId: 'pay_live_8241',
      paymentMode: 'RAZORPAY',
      idempotencyKey: 'idemp_seed_8241',
      estimatedDeliveryMinutes: 14,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      auditLogs: [
        {
          id: 'log_1',
          orderId: 'EP-8241',
          previousStatus: OrderStatus.PLACED,
          newStatus: OrderStatus.ACCEPTED,
          changedBy: 'RESTAURANT',
          reason: 'Kitchen confirmed order',
          timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString()
        },
        {
          id: 'log_2',
          orderId: 'EP-8241',
          previousStatus: OrderStatus.ACCEPTED,
          newStatus: OrderStatus.PREPARING,
          changedBy: 'RESTAURANT',
          reason: 'Woodfired oven stone baking started',
          timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString()
        },
        {
          id: 'log_3',
          orderId: 'EP-8241',
          previousStatus: OrderStatus.PREPARING,
          newStatus: OrderStatus.PICKED_UP,
          changedBy: 'RIDER',
          reason: 'Julian collected thermo-wrapped pizza box',
          timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString()
        },
        {
          id: 'log_4',
          orderId: 'EP-8241',
          previousStatus: OrderStatus.PICKED_UP,
          newStatus: OrderStatus.OUT_FOR_DELIVERY,
          changedBy: 'RIDER',
          reason: 'Departed restaurant on Electric Vespa',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
        }
      ]
    };
    this.orders.set(order.id, order);
  }
}
