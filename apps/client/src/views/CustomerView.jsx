// apps/client/src/views/CustomerView.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useStore, formatETB } from '../store/useStore';

const CustomerView = () => {
  const { menu, setMenu, addItem, cart, activeOrder, setActiveOrder, config } = useStore();
  const [category, setCategory] = useState('All');
  const [customerName, setCustomerName] = useState('');
  const [table, setTable] = useState('Pickup');
  const [tables, setTables] = useState([]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/menu`).then(res => setMenu(res.data));
    axios.get(`${import.meta.env.VITE_API_URL}/api/tables`).then(res => setTables(res.data));
  }, []);

  const categories = ['All', ...new Set(menu.map(item => item.category))];
  const filteredMenu = category === 'All' ? menu : menu.filter(item => item.category === category);

  const placeOrder = async () => {
    if (!customerName || cart.length === 0) return alert('ስም እና ዕቃዎች ያስፈልጋሉ!');
    
    try {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const payload = {
        customer: table === 'Pickup' ? `${customerName} (Pickup)` : `${customerName}`,
        items: cart.map(item => ({ productId: item.id, quantity: item.quantity })),
        total
      };
      if (table !== 'Pickup') payload.tableId = table;
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/orders`, payload);
      setActiveOrder(res.data);
      useStore.getState().clearCart();
    } catch (err) {
      alert('ትዕዛዙ አልተሳካም');
    }
  };

  if (activeOrder) {
    return (
      <div className="max-w-md mx-auto glass p-10 rounded-[40px] shadow-2xl border-0.5 border-black/5 animate-fade-in-up">
        <h2 className="text-3xl font-serif font-black mb-2 tracking-tightest text-[#120B05]">ትዕዛዝዎን በመከታተል ላይ</h2>
        <p className="text-[10px] uppercase tracking-widest font-bold mb-10" style={{ color: config?.primaryColor || '#D49E4A' }}>
          Tracking Order • {activeOrder.id}
        </p>
        
        <div className="space-y-10">
          <div className="relative h-2 bg-black/5 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(0,0,0,0.2)]"
              style={{ 
                width: activeOrder.status === 'NEW' ? '33%' : activeOrder.status === 'PREPARING' ? '66%' : '100%',
                backgroundColor: config?.primaryColor || '#D49E4A'
              }}
            />
          </div>
          
          <div className="flex justify-between text-[10px] uppercase tracking-widest font-black text-black/20">
            {['አዲስ', 'እየተሰራ', 'ተዘጋጀ'].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded-full border-2 ${
                    (i === 0 && activeOrder.status === 'NEW') || 
                    (i === 1 && activeOrder.status === 'PREPARING') || 
                    (i === 2 && (activeOrder.status === 'READY' || activeOrder.status === 'DONE'))
                    ? 'animate-steam' : 'bg-transparent border-black/10'
                  }`}
                  style={{ 
                    backgroundColor: (i === 0 && activeOrder.status === 'NEW') || (i === 1 && activeOrder.status === 'PREPARING') || (i === 2 && (activeOrder.status === 'READY' || activeOrder.status === 'DONE')) ? (config?.primaryColor || '#D49E4A') : 'transparent',
                    borderColor: (i === 0 && activeOrder.status === 'NEW') || (i === 1 && activeOrder.status === 'PREPARING') || (i === 2 && (activeOrder.status === 'READY' || activeOrder.status === 'DONE')) ? (config?.primaryColor || '#D49E4A') : 'black/10'
                  }}
                ></div>
                <span className={(i === 0 && activeOrder.status === 'NEW') || (i === 1 && activeOrder.status === 'PREPARING') || (i === 2 && (activeOrder.status === 'READY' || activeOrder.status === 'DONE')) ? 'text-[#120B05]' : ''}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {(activeOrder.status === 'READY' || activeOrder.status === 'DONE') && (
          <button 
            onClick={() => setActiveOrder(null)}
            className="w-full mt-12 py-5 bg-[#120B05] text-white rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-[#D49E4A] transition-all"
          >
            አዲስ ትዕዛዝ ያስገቡ (New Order)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-[#FAF9F6] min-h-screen relative shadow-[0_0_50px_rgba(0,0,0,0.1)]">
      <div className={`space-y-8 px-6 pt-8 pb-32 ${cart.length > 0 ? 'pb-[320px]' : ''}`}>
      <section className="text-center space-y-2 md:space-y-4 max-h-[120px] md:max-h-none overflow-hidden">
        <h2 className="text-4xl md:text-6xl font-serif font-black tracking-tightest text-[#120B05] leading-tight">{config?.cafeNameAmharic || 'ምናሌ (Menu)'}</h2>
        <p className="text-[10px] md:text-[12px] uppercase tracking-widest font-black" style={{ color: config?.primaryColor || '#D49E4A' }}>
          የእርስዎን ምርጫ ይምረጡ • Select your favorite
        </p>
      </section>

      <div className="sticky top-0 z-30 flex justify-start gap-2 overflow-x-auto py-4 no-scrollbar bg-[#FAF9F6]/95 backdrop-blur-md -mx-6 px-6">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap shadow-sm border-0.5 ${
              category === c ? 'bg-[#120B05] text-white border-[#120B05]' : 'glass text-black/40 border-black/5 hover:text-black'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredMenu.map(item => (
          <div key={item.id} className="glass rounded-[40px] border-0.5 border-black/5 shadow-xl hover:shadow-2xl transition-all duration-700 group cursor-pointer relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#D49E4A]/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-[#D49E4A]/10 transition-all"></div>
            
            {/* Image Section */}
            <div className="h-48 w-full bg-black/5 relative overflow-hidden rounded-t-[40px]">
              {item.image ? (
                <img 
                  src={`${import.meta.env.VITE_API_URL}${item.image}`} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500 animate-floating">
                  {item.icon}
                </div>
              )}
            </div>

            <div className="p-8 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-black text-2xl tracking-tight text-[#120B05]">{item.name}</h3>
                <p className="text-[10px] text-black/30 font-black uppercase tracking-widest">{item.category}</p>
              </div>
              <span className="font-serif font-black text-2xl text-[#120B05]">{formatETB(item.price)}</span>
              <button 
                onClick={() => addItem(item)}
                className="w-14 h-14 text-white rounded-3xl flex items-center justify-center font-black text-xl hover:opacity-90 transition-all active:scale-90 shadow-lg"
                style={{ backgroundColor: config?.primaryColor || '#120B05' }}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && createPortal(
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 animate-fade-in-up">
          <div className="glass-dark text-white p-6 md:p-8 rounded-t-[40px] md:rounded-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] md:shadow-[0_30px_60px_rgba(0,0,0,0.3)] border-t-0.5 md:border-0.5 border-white/10 space-y-6 md:space-y-8 pb-8 md:pb-8">
            <div className="flex justify-between items-end border-b border-white/10 pb-6">
              <div>
                <span className="font-serif font-black text-2xl tracking-tight">ጠቅላላ (Total)</span>
                <span className="block text-[10px] opacity-40 font-black uppercase tracking-widest mt-1">{cart.length} ዕቃዎች • Items</span>
              </div>
              <span className="font-black text-4xl font-serif" style={{ color: config?.primaryColor || '#D49E4A' }}>
                {formatETB(cart.reduce((s, i) => s + i.price * i.quantity, 0))}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="ስም (Name)" 
                className="bg-white/5 border-0.5 border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#D49E4A] transition-all"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
              <select 
                className="bg-white/5 border-0.5 border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#D49E4A] transition-all appearance-none"
                value={table}
                onChange={e => setTable(e.target.value)}
              >
                <option value="Pickup">Pickup</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>Table {t.number}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={placeOrder}
              className="w-full py-5 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all active:scale-95 shadow-2xl"
              style={{ backgroundColor: config?.primaryColor || '#D49E4A' }}
            >
              ትዕዛዝ ላክ (Send Order)
            </button>
          </div>
        </div>,
        document.body
      )}
      </div>
    </div>
  );
};

export default CustomerView;
