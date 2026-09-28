import { DatabaseService } from '../db/in-memory-db.service';
import { IRestaurant, IMenuItem } from '@deliverapp/types';

export class RestaurantService {
  private db = DatabaseService.getInstance();

  getRestaurants(filters?: { query?: string; pureVeg?: boolean; minRating?: number }): IRestaurant[] {
    let list = Array.from(this.db.restaurants.values());

    if (filters?.pureVeg) {
      list = list.filter(r => r.pureVeg);
    }
    if (filters?.minRating) {
      list = list.filter(r => r.rating >= filters.minRating!);
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.cuisine.some(c => c.toLowerCase().includes(q)) ||
        r.tagline.toLowerCase().includes(q)
      );
    }
    return list;
  }

  getRestaurantById(id: string): IRestaurant {
    const restaurant = this.db.restaurants.get(id);
    if (!restaurant) throw new Error(`Restaurant with ID ${id} not found.`);
    return restaurant;
  }

  toggleMenuItemAvailability(itemId: string, isAvailable: boolean): IMenuItem {
    const item = this.db.menuItems.get(itemId);
    if (!item) throw new Error(`Menu item ${itemId} not found.`);
    item.isAvailable = isAvailable;
    return item;
  }
}
