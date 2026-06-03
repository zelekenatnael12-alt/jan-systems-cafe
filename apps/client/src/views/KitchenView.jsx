// apps/client/src/views/KitchenView.jsx
// Phase 2: Full KDS (Kitchen Display Screen) Upgrade
// ─ Real-time WebSocket order management
// ─ Urgency timer with colour escalation (green → amber → red)
// ─ Column-lane layout: NEW | PREPARING | READY
// ─ Audio alert on new order
// ─ Amharic/English bilingual labels
// ─ EthioPay + Bank Transfer in payment modal (mirrors config toggles)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useStore, socket } from '../store/useStore';
import { Clock, ChefHat, CheckCircle2, BellRing, Flame, Wifi, WifiOff, ArrowLeft } from 'lucide-react';

// ── Urgency thresholds (minutes) ─────────────────────────────────────────────
const URGENCY = [
  { max: 5,   color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   label: 'Fresh',   pulse: false },
  { max: 10,  color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  label: 'Waiting', pulse: false },
  { max: 20,  color: '#f97316', bg: 'rgba(249,115,22,0.12)',  label: 'Urgent',  pulse: true  },
  { max: Infinity, color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'CRITICAL', pulse: true },
];

function getUrgency(createdAt) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  return { mins, ...(URGENCY.find(u => mins < u.max) || URGENCY[3]) };
}

function formatElapsed(mins) {
  if (mins < 1)  return '< 1 ደቂቃ';
  if (mins < 60) return `${mins} ደቂቃ (${mins}m)`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ── Payment Method Config ─────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'CASH',          label: 'ጥሬ ገንዘብ',   en: 'Cash',          configKey: 'enableCash' },
  { id: 'TELEBIRR',      label: 'ቴሌብር',       en: 'Telebirr',      configKey: 'enableTelebirr' },
  { id: 'CBE_BIRR',      label: 'CBE ብር',      en: 'CBE Birr',      configKey: 'enableCbeBirr' },
  { id: 'ETHIOPAY',      label: 'ኢትዮፔይ',      en: 'EthioPay',      configKey: 'enableEthiopay' },
  { id: 'BANK_TRANSFER', label: 'ባንክ ዝውውር',   en: 'Bank Transfer',  configKey: 'enableBankTransfer' },
  { id: 'OTHER',         label: 'ሌላ',          en: 'Other',          configKey: null },
];

// ── Audio alert ───────────────────────────────────────────────────────────────
function playAlert() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 150, 300].forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay / 1000);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.3);
      osc.start(ctx.currentTime + delay / 1000);
      osc.stop(ctx.currentTime + delay / 1000 + 0.35);
    });
  } catch (_) { /* AudioContext not available */ }
}

// ── Column Layout ─────────────────────────────────────────────────────────────
const COLUMNS = [
  { status: 'NEW',       label: 'አዲስ ትዕዛዝ',   en: 'Incoming',  icon: BellRing,    next: 'PREPARING', actionLabel: 'ተቀበለ (Accept)',     actionColor: '#3b82f6' },
  { status: 'PREPARING', label: 'እየተዘጋጀ',       en: 'Preparing', icon: ChefHat,     next: 'READY',     actionLabel: 'ዝግጁ (Ready)',        actionColor: '#f59e0b' },
  { status: 'READY',     label: 'ዝግጁ ነው',       en: 'Ready',     icon: CheckCircle2, next: 'DONE',     actionLabel: 'ፈፀምቷል (Collect)',    actionColor: '#22c55e' },
];

const KitchenView = () => {
  const { config, setView } = useStore();
  const [orders, setOrders]           = useState([]);
  const [now, setNow]                 = useState(Date.now());
  const [paymentModal, setPaymentModal] = useState(null); // { orderId }
  const [connected, setConnected]     = useState(socket.connected);
  const [newOrderFlash, setNewOrderFlash] = useState(false);
  const token = localStorage.getItem('jan_token');

  // Tick every 30s to update urgency colours
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // ── Socket.IO ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    // Load initial orders
    axios.get(`${import.meta.env.VITE_API_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setOrders(res.data.filter(o => !['DONE', 'CANCELLED', 'VOIDED'].includes(o.status)));
    });

    socket.emit('join-room', 'kitchen');

    const onConnect    = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onNewOrder = (order) => {
      setOrders(prev => [order, ...prev]);
      playAlert();
      setNewOrderFlash(true);
      setTimeout(() => setNewOrderFlash(false), 2000);
    };

    const onUpdated = (updated) => {
      setOrders(prev => {
        if (['DONE', 'CANCELLED', 'VOIDED'].includes(updated.status)) {
          return prev.filter(o => o.id !== updated.id);
        }
        return prev.map(o => o.id === updated.id ? updated : o);
      });
    };

    socket.on('connect',       onConnect);
    socket.on('disconnect',    onDisconnect);
    socket.on('order:new',     onNewOrder);
    socket.on('order:updated', onUpdated);

    return () => {
      socket.off('connect',       onConnect);
      socket.off('disconnect',    onDisconnect);
      socket.off('order:new',     onNewOrder);
      socket.off('order:updated', onUpdated);
    };
  }, [token]);

  // ── Status Update ──────────────────────────────────────────────────────────
  const updateStatus = useCallback(async (orderId, nextStatus, paymentMethod = null) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/orders/${orderId}/status`,
        { status: nextStatus, ...(paymentMethod ? { paymentMethod } : {}) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPaymentModal(null);
    } catch (err) {
      console.error('Status update failed', err);
    }
  }, [token]);

  const handleAction = (order, column) => {
    if (column.next === 'DONE') {
      setPaymentModal({ orderId: order.id, order });
      return;
    }
    updateStatus(order.id, column.next);
  };

  if (!token) {
    return (
      <div className="text-center py-20 glass m-10 rounded-[40px] font-black text-black/40 uppercase tracking-widest text-2xl relative">
        እባክዎን መጀመሪያ ይግቡ • LOGIN REQUIRED

        {/* Demo Credentials Helper */}
        <div className="mt-8 p-6 rounded-3xl bg-[#D49E4A]/10 border border-[#D49E4A]/20 max-w-sm mx-auto text-center font-sans tracking-normal">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#D49E4A] mb-2">Staff Demo Access (የሙከራ መግቢያ)</p>
          <p className="text-[11px] text-[#120B05] opacity-70 mb-4">Click below to instantly log in as Demo Staff and access the KDS Kitchen interface.</p>
          <button 
            onClick={async () => {
              try {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { 
                  email: 'staff@jan.com', 
                  password: 'password123' 
                });
                localStorage.setItem('jan_token', res.data.token);
                localStorage.setItem('jan_refresh_token', res.data.refreshToken);
                localStorage.setItem('jan_user', JSON.stringify(res.data.user));
                localStorage.setItem('jan_venue_slug', 'demo-cafe');
                window.location.reload();
              } catch (err) { alert('Demo Login failed'); }
            }}
            className="w-full py-4 bg-[#120B05] text-white hover:bg-[#D49E4A] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl"
          >
            Quick Demo Login
          </button>
        </div>

        <div className="mt-8">
          <button 
            onClick={() => setView('landing')}
            className="px-6 py-3 bg-[#120B05] text-white hover:bg-[#D49E4A] transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 shadow-xl"
          >
            <ArrowLeft size={12} /> ወደ ዋናው ገጽ ይመለሱ (Back to Home)
          </button>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => ['NEW','PREPARING','READY'].includes(o.status));

  return (
    <div className="pb-32 animate-fade-in">

      {/* ── HEADER ── */}
      <header className="flex justify-between items-start px-2 mb-10">
        <div className="space-y-2">
          <h2 className="text-5xl font-serif font-black tracking-tightest text-[#120B05]">
            {config?.cafeNameAmharic || 'ኩሽና'} <span className="text-black/20 font-sans text-3xl">KDS</span>
          </h2>
          <p className="text-[11px] uppercase tracking-widest font-black italic" style={{ color: config?.primaryColor || '#D49E4A' }}>
            Kitchen Display System — Live Orders Command Center
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Order count badge */}
          <div className="flex flex-col items-center bg-black/5 px-5 py-3 rounded-2xl">
            <span className="text-[9px] font-black uppercase tracking-widest text-black/30">Active</span>
            <span className="text-2xl font-serif font-black text-[#120B05]">{activeOrders.length}</span>
          </div>

          {/* Connection status */}
          <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
            connected ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100 animate-pulse'
          }`}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? 'Live' : 'Offline'}
          </div>
        </div>
      </header>

      {/* ── NEW ORDER FLASH ── */}
      {newOrderFlash && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-3 px-8 py-4 rounded-3xl text-white font-black text-sm shadow-2xl animate-pulse"
            style={{ backgroundColor: config?.primaryColor || '#D49E4A' }}>
            <BellRing size={18} /> አዲስ ትዕዛዝ! — NEW ORDER!
          </div>
        </div>
      )}

      {/* ── 3-COLUMN KDS LANES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {COLUMNS.map(col => {
          const colOrders = orders.filter(o => o.status === col.status);
          const ColIcon = col.icon;

          return (
            <div key={col.status} className="space-y-4">

              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <ColIcon size={16} style={{ color: col.actionColor }} />
                  <h3 className="font-black text-sm uppercase tracking-widest text-[#120B05]">
                    {col.label}
                  </h3>
                  <span className="text-[9px] text-black/30 font-black uppercase">({col.en})</span>
                </div>
                {colOrders.length > 0 && (
                  <span className="w-6 h-6 rounded-full text-white text-[10px] font-black flex items-center justify-center"
                    style={{ backgroundColor: col.actionColor }}>
                    {colOrders.length}
                  </span>
                )}
              </div>

              {/* Empty lane */}
              {colOrders.length === 0 && (
                <div className="glass rounded-[30px] p-8 text-center text-black/15 font-black text-[10px] uppercase tracking-widest border border-dashed border-black/10">
                  {col.status === 'NEW' ? 'ትዕዛዝ በመጠባበቅ ላይ...' : 'ባዶ ነው'}
                </div>
              )}

              {/* Order cards */}
              {colOrders.map(order => {
                const urgency = getUrgency(order.createdAt);

                return (
                  <div
                    key={order.id}
                    className={`glass rounded-[30px] p-6 shadow-lg transition-all duration-700 relative overflow-hidden ${urgency.pulse ? 'animate-pulse' : ''}`}
                    style={{
                      borderColor: `${urgency.color}30`,
                      borderWidth: '1.5px',
                      backgroundColor: urgency.bg,
                    }}
                  >
                    {/* Urgency bar at top */}
                    <div className="absolute top-0 left-0 w-full h-1 rounded-t-[30px]"
                      style={{ backgroundColor: urgency.color }} />

                    {/* Card header */}
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <h4 className="font-black text-lg text-[#120B05] tracking-tight">
                          {order.customer || 'Guest'}
                        </h4>
                        {order.table && (
                          <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mt-0.5">
                            Table #{order.table?.number || '—'}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end" style={{ color: urgency.color }}>
                          <Clock size={10} />
                          <span className="text-[9px] font-black">{formatElapsed(urgency.mins)}</span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: urgency.color }}>
                          {urgency.label}
                        </span>
                      </div>
                    </div>

                    {/* Items list */}
                    <div className="space-y-2 mb-5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white/40 px-4 py-2.5 rounded-2xl border-0.5 border-black/5">
                          <div className="flex items-center gap-2.5">
                            {item.product.image ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL}${item.product.image}`}
                                alt={item.product.name}
                                className="w-8 h-8 rounded-xl object-cover"
                              />
                            ) : (
                              <span className="text-lg w-8 text-center">{item.product.icon}</span>
                            )}
                            <span className="text-[#120B05] font-bold text-sm">{item.product.name}</span>
                          </div>
                          <span className="text-white text-[10px] font-black w-7 h-7 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: urgency.color }}>
                            ×{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order ID */}
                    <p className="text-[8px] text-black/20 font-black uppercase mb-3">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>

                    {/* Action button */}
                    <button
                      onClick={() => handleAction(order, col)}
                      className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all"
                      style={{ backgroundColor: col.actionColor }}
                    >
                      {col.actionLabel}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── PAYMENT METHOD MODAL (for READY → DONE) ── */}
      {paymentModal && (
        <div className="fixed inset-0 bg-[#120B05]/90 backdrop-blur-md flex items-center justify-center p-6 z-[60] animate-fade-in">
          <div className="glass w-full max-w-sm p-8 rounded-[40px] shadow-2xl space-y-6 border border-white/10">

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: config?.primaryColor || '#D49E4A' }}>
                <CheckCircle2 size={22} className="text-white" />
              </div>
              <h3 className="text-xl font-serif font-black text-[#120B05]">የክፍያ ዘዴ</h3>
              <p className="text-[9px] uppercase tracking-widest font-black" style={{ color: config?.primaryColor || '#D49E4A' }}>
                Select Payment Method to Complete
              </p>
            </div>

            <div className="space-y-2">
              {PAYMENT_METHODS
                .filter(m => m.configKey === null || config?.[m.configKey])
                .map(m => (
                  <button
                    key={m.id}
                    onClick={() => updateStatus(paymentModal.orderId, 'DONE', m.id)}
                    className="w-full py-4 bg-black/5 border border-black/10 rounded-2xl font-black text-[10px] tracking-widest flex justify-between items-center px-5 hover:border-transparent hover:text-white transition-all duration-300"
                    style={{ '--hover-bg': config?.primaryColor || '#D49E4A' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = config?.primaryColor || '#D49E4A'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = ''; }}
                  >
                    <span className="text-sm">{m.label}</span>
                    <span className="opacity-40">{m.en}</span>
                  </button>
                ))}
            </div>

            <button
              onClick={() => setPaymentModal(null)}
              className="w-full text-[9px] text-black/20 font-black uppercase tracking-widest hover:text-black transition-colors py-2"
            >
              ተመለስ — Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenView;
