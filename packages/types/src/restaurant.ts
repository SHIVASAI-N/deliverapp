export interface IMenuItemOptionChoice {
  id: string;
  name: string;
  priceDelta: number;
  isDefault?: boolean;
}

export interface IMenuItemOptionGroup {
  id: string;
  title: string;
  required: boolean;
  minSelections?: number;
  maxSelections?: number;
  choices: IMenuItemOptionChoice[];
}

export interface IMenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl?: string;
  tag?: string; // 'Bestseller' | 'Chef Pick' | 'New'
  optionGroups?: IMenuItemOptionGroup[];
}

export interface IMenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
  items: IMenuItem[];
}

export interface IRestaurant {
  id: string;
  name: string;
  tagline: string;
  cuisine: string[];
  rating: number;
  totalReviews: number;
  avgPreparationMinutes: number;
  deliveryTimeEstimate: string; // e.g., '25-30 mins'
  distanceKm: number;
  pureVeg: boolean;
  isOpen: boolean;
  heroImageUrl: string;
  logoUrl?: string;
  address: {
    street: string;
    area: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  contactPhone: string;
  categories?: IMenuCategory[];
}
