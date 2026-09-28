'use client';

import React, { useState, useEffect } from 'react';
import { IRestaurant, IMenuItem } from '@deliverapp/types';
import { MenuInventoryToggle } from '../../components/MenuInventoryToggle';
import { fetchRestaurantDetail } from '../../services/api';

const RESTAURANT_ID = 'rest_forno_doro';

export default function MenuManagementPage() {
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurantDetail(RESTAURANT_ID)
      .then(data => setRestaurant(data))
      .catch(err => console.error('Failed to load menu details:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleItemUpdated = (updated: IMenuItem) => {
    if (!restaurant || !restaurant.categories) return;
    const nextCategories = restaurant.categories.map(cat => ({
      ...cat,
      items: cat.items.map(it => it.id === updated.id ? updated : it)
    }));
    setRestaurant({ ...restaurant, categories: nextCategories });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!restaurant || !restaurant.categories) {
    return (
      <div className="text-center py-20 text-stone-400">
        Restaurant menu not found.
      </div>
    );
  }

  return (
    <div className="py-6">
      <MenuInventoryToggle
        categories={restaurant.categories}
        onItemUpdated={handleItemUpdated}
      />
    </div>
  );
}
