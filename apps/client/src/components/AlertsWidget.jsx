// apps/client/src/components/AlertsWidget.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, X, ShoppingCart, Clock } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL);

const AlertsWidget = () => {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const token = localStorage.getItem('jan_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/inventory/alerts`, { headers });
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    }
  };

  useEffect(() => {
    fetchAlerts();

    socket.on('inventory:updated', () => {
      fetchAlerts();
    });

    socket.on('inventory:update', () => {
      fetchAlerts();
    });

    return () => {
      socket.off('inventory:updated');
      socket.off('inventory:update');
    };
  }, []);

  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="mb-10 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
          ትኩረት የሚያስፈልጋቸው (Action Required)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleAlerts.map(alert => (
          <div 
            key={alert.id}
            className={`relative group overflow-hidden p-6 rounded-[35px] border-0.5 transition-all shadow-xl flex flex-col justify-between ${
              alert.projectedDays <= 1 
                ? 'bg-red-50 border-red-200' 
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            {/* Background Icon Watermark */}
            <AlertTriangle 
              size={120} 
              className={`absolute -right-8 -bottom-8 opacity-[0.03] rotate-12 transition-transform group-hover:scale-110 ${
                alert.projectedDays <= 1 ? 'text-red-500' : 'text-amber-500'
              }`} 
            />

            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <h4 className="font-black text-espresso tracking-tight">{alert.name}</h4>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">
                  {alert.amount.toFixed(1)} {alert.unit} remaining
                </p>
              </div>
              <button 
                onClick={() => setDismissed([...dismissed, alert.id])}
                className="p-2 hover:bg-black/5 rounded-full transition-colors text-black/20 hover:text-black"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-8 flex items-end justify-between relative z-10">
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-serif font-black ${
                  alert.projectedDays <= 1 ? 'text-red-600' : 'text-amber-600'
                }`}>
                  {alert.projectedDays}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Days left</span>
              </div>

              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${
                alert.projectedDays <= 1 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-200' 
                  : 'bg-amber-600 text-white shadow-lg shadow-amber-200'
              }`}>
                <ShoppingCart size={12} />
                {alert.projectedDays <= 1 ? 'Order Now' : 'Order Soon'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsWidget;
