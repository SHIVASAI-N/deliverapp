import React, { useState } from 'react';
import { IMenuItem, IMenuCategory } from '@deliverapp/types';
import { toggleMenuItemStock } from '../services/api';

interface MenuInventoryProps {
  categories: IMenuCategory[];
  onItemUpdated: (updatedItem: IMenuItem) => void;
}

export const MenuInventoryToggle: React.FC<MenuInventoryProps> = ({
  categories,
  onItemUpdated
}) => {
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  const handleToggle = async (item: IMenuItem) => {
    try {
      setLoadingItemId(item.id);
      const nextState = !item.isAvailable;
      const updated = await toggleMenuItemStock(item.id, nextState);
      onItemUpdated(updated);
    } catch (err) {
      console.error('Failed to toggle item availability:', err);
    } finally {
      setLoadingItemId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-stone-800">
        <div>
          <h2 className="text-xl font-bold text-stone-100">Menu Availability &amp; 86&apos;ing</h2>
          <p className="text-xs text-stone-400 mt-1">
            Toggle dishes instantly out of stock. Changes propagate immediately to all customer carts and apps in real-time.
          </p>
        </div>
        <div className="text-xs text-stone-500 font-mono">
          Last Synced: Just now
        </div>
      </div>

      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-stone-850 px-6 py-3 border-b border-stone-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">{category.name}</h3>
              <span className="text-xs text-stone-400 font-medium">
                {category.items.filter(i => i.isAvailable).length} / {category.items.length} In Stock
              </span>
            </div>

            <div className="divide-y divide-stone-800">
              {category.items.map((item) => {
                const isItemLoading = loadingItemId === item.id;
                return (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-stone-850/50 transition-colors">
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className={`text-sm font-semibold ${item.isAvailable ? 'text-stone-200' : 'text-stone-500 line-through'}`}>
                          {item.name}
                        </span>
                        {item.tag && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 line-clamp-1">{item.description}</p>
                      <div className="text-xs font-mono font-medium text-stone-300">₹{item.price}</div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${
                        item.isAvailable ? 'text-emerald-400' : 'text-stone-500'
                      }`}>
                        {item.isAvailable ? 'In Stock' : 'Sold Out (86)'}
                      </span>
                      <button
                        disabled={isItemLoading}
                        onClick={() => handleToggle(item)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                          item.isAvailable ? 'bg-emerald-600 justify-end' : 'bg-stone-700 justify-start'
                        }`}
                      >
                        <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
