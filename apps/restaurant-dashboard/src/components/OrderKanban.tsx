import React, { useState } from 'react';
import { IOrder, OrderStatus } from '@deliverapp/types';
import { LiveOrderTrackingMap } from './LiveOrderTrackingMap';

interface OrderKanbanProps {
  orders: IOrder[];
  onTransition: (orderId: string, nextStatus: OrderStatus, reason?: string) => Promise<void>;
  isUpdating: string | null;
}

export const OrderKanban: React.FC<OrderKanbanProps> = ({
  orders,
  onTransition,
  isUpdating
}) => {
  const [trackingOrder, setTrackingOrder] = useState<IOrder | null>(null);

  // Categorize orders into kanban columns
  const incoming = orders.filter(o => o.status === OrderStatus.PLACED);
  const accepted = orders.filter(o => o.status === OrderStatus.ACCEPTED);
  const preparing = orders.filter(o => o.status === OrderStatus.PREPARING);
  const ready = orders.filter(o => o.status === OrderStatus.READY_FOR_PICKUP);
  const completed = orders.filter(o => [OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(o.status));

  const renderOrderCard = (order: IOrder) => {
    const elapsedMinutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
    const isBusy = isUpdating === order.id;

    return (
      <div 
        key={order.id}
        className="bg-stone-850 rounded-xl p-5 border border-stone-800 hover:border-stone-700 transition-all shadow-sm space-y-4"
      >
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-amber-400 font-mono tracking-wide">{order.id}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-medium">
                {order.items.reduce((s, i) => s + (i.quantity || 1), 0)} items
              </span>
            </div>
            <div className="text-xs text-stone-400 mt-0.5">
              Patron: <span className="text-stone-200 font-medium">{order.customerName}</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              elapsedMinutes > 15 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-stone-800 text-stone-400'
            }`}>
              ⏱ {elapsedMinutes}m ago
            </span>
            <div className="text-xs font-mono font-bold text-stone-300 mt-1">
              ₹{order.bill?.total || 0}
            </div>
          </div>
        </div>

        {/* Item List */}
        <div className="bg-stone-900/80 rounded-lg p-3 space-y-2 border border-stone-800/80">
          {order.items.map((item, idx) => (
            <div key={idx} className="text-xs flex items-start justify-between">
              <div>
                <span className="font-semibold text-amber-300 mr-2">{item.quantity}×</span>
                <span className="text-stone-100 font-medium">{item.name}</span>
                {item.selectedOptions && item.selectedOptions.length > 0 && (
                  <div className="text-[11px] text-stone-400 pl-4 mt-0.5">
                    ↳ {item.selectedOptions.map(o => o.name).join(', ')}
                  </div>
                )}
              </div>
              <span className="text-stone-400 font-mono">₹{item.totalPrice || item.unitPrice * item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Special Instructions */}
        {order.deliveryAddress?.street && (
          <div className="text-[11px] text-stone-400 flex items-center space-x-1">
            <span className="text-stone-500">Destination:</span>
            <span className="truncate">{order.deliveryAddress.street}, {order.deliveryAddress.area}</span>
          </div>
        )}

        {/* Action Controls based on State Machine */}
        <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
          {order.status === OrderStatus.PLACED && (
            <button
              disabled={isBusy}
              onClick={() => onTransition(order.id, OrderStatus.ACCEPTED, 'Order accepted by kitchen staff')}
              className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors shadow flex items-center justify-center space-x-1"
            >
              <span>{isBusy ? 'Confirming...' : 'Accept Ticket'}</span>
            </button>
          )}

          {order.status === OrderStatus.ACCEPTED && (
            <button
              disabled={isBusy}
              onClick={() => onTransition(order.id, OrderStatus.PREPARING, 'Fired in wood-burning oven')}
              className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors shadow flex items-center justify-center space-x-1"
            >
              <span>{isBusy ? 'Firing...' : 'Start Cooking 🔥'}</span>
            </button>
          )}

          {order.status === OrderStatus.PREPARING && (
            <button
              disabled={isBusy}
              onClick={() => onTransition(order.id, OrderStatus.READY_FOR_PICKUP, 'Order boxed in thermal packaging')}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors shadow flex items-center justify-center space-x-1"
            >
              <span>{isBusy ? 'Packing...' : 'Ready at Pass 📦'}</span>
            </button>
          )}

          {order.status === OrderStatus.READY_FOR_PICKUP && (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-amber-400 font-medium animate-pulse">Awaiting Courier...</span>
              <button
                disabled={isBusy}
                onClick={() => onTransition(order.id, OrderStatus.PICKED_UP, 'Handed over to delivery rider')}
                className="py-1.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-semibold rounded-lg text-xs transition-colors"
              >
                Manual Handover
              </button>
            </div>
          )}

          {[OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY].includes(order.status) && (
            <div className="w-full flex items-center justify-between text-xs text-emerald-400">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-1" />
                In Transit with Courier
              </span>
              <button
                onClick={() => setTrackingOrder(order)}
                className="py-1 px-2.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-700/50 text-blue-300 rounded text-xs font-semibold flex items-center space-x-1 transition-colors shadow-sm"
              >
                <span>📍</span>
                <span>Track</span>
              </button>
            </div>
          )}

          {order.status === OrderStatus.DELIVERED && (
            <div className="w-full flex items-center justify-between text-xs text-stone-400 py-1">
              <span>✓ Successfully Handed Over</span>
              <button
                onClick={() => setTrackingOrder(order)}
                className="py-1 px-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[11px] font-medium transition-colors"
              >
                Route Log
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
      {/* Col 1: Incoming / New Tickets */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-200">New Tickets</h2>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 text-xs font-mono font-bold">
            {incoming.length}
          </span>
        </div>
        <div className="space-y-4 flex-1">
          {incoming.length === 0 ? (
            <div className="text-center py-12 text-stone-600 text-xs italic">No pending tickets</div>
          ) : (
            incoming.map(renderOrderCard)
          )}
        </div>
      </div>

      {/* Col 2: In Preparation */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-200">Cooking / Fire</h2>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 text-xs font-mono font-bold">
            {accepted.length + preparing.length}
          </span>
        </div>
        <div className="space-y-4 flex-1">
          {[...accepted, ...preparing].length === 0 ? (
            <div className="text-center py-12 text-stone-600 text-xs italic">Kitchen pass clear</div>
          ) : (
            [...accepted, ...preparing].map(renderOrderCard)
          )}
        </div>
      </div>

      {/* Col 3: Ready for Pickup */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-200">Ready at Pass</h2>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 text-xs font-mono font-bold">
            {ready.length}
          </span>
        </div>
        <div className="space-y-4 flex-1">
          {ready.length === 0 ? (
            <div className="text-center py-12 text-stone-600 text-xs italic">No boxed tickets</div>
          ) : (
            ready.map(renderOrderCard)
          )}
        </div>
      </div>

      {/* Col 4: Dispatched / Out for Delivery */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-200">En Route / Delivered</h2>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 text-xs font-mono font-bold">
            {completed.length}
          </span>
        </div>
        <div className="space-y-4 flex-1">
          {completed.length === 0 ? (
            <div className="text-center py-12 text-stone-600 text-xs italic">No active couriers</div>
          ) : (
            completed.map(renderOrderCard)
          )}
        </div>
      </div>
    </div>

    {trackingOrder && (
        <LiveOrderTrackingMap
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
        />
      )}
    </>
  );
};
