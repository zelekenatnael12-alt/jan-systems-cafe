// apps/client/src/views/WaiterView.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore, formatETB, socket } from '../store/useStore';
import { ShoppingCart, ClipboardList, CheckCircle2, Clock, MapPin, User, ChevronRight, LayoutGrid, X } from 'lucide-react';
import TableGrid from '../components/TableGrid';
import PaymentModal from '../components/PaymentModal';


const WaiterView = () => {
  const { menu, setMenu, addItem, cart, clearCart, config } = useStore();
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'manage'
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [category, setCategory] = useState('All');
  const [customerName, setCustomerName] = useState('');
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const token = localStorage.getItem('jan_token');

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/menu`).then(res => setMenu(res.data));
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data.filter(o => o.status !== 'DONE'));
      } catch (err) {
        console.error('Failed to fetch orders', err);
      }
    };

    const fetchTables = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/tables`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTables(res.data);
      } catch (err) {
        console.error('Failed to fetch tables', err);
      }
    };

    fetchOrders();
    fetchTables();

    socket.on('order:new', (order) => {
      setOrders(prev => [...prev, order]);
    });

    socket.on('order:updated', (updated) => {
      setOrders(prev => {
        if (updated.status === 'DONE') return prev.filter(o => o.id !== updated.id);
        return prev.map(o => o.id === updated.id ? updated : o);
      });
      // Fetch tables again on order updates since they change table status
      fetchTables();
    });

    socket.on('table:updated', (updated) => {
      setTables(prev => prev.map(t => t.id === updated.id ? updated : t));
    });

    return () => {
      socket.off('order:new');
      socket.off('order:updated');
      socket.off('table:updated');
    };
  }, [token]);

  const placeOrder = async () => {
    if (!selectedTable) return alert('ጠረጴዛ ይምረጡ • SELECT A TABLE');
    if (cart.length === 0) return alert('ዕቃዎች ያስፈልጋሉ • ADD ITEMS');
    
    try {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/orders`, {
        customer: customerName,
        tableId: selectedTable.id,
        items: cart.map(item => ({ productId: item.id, quantity: item.quantity })),
        total
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      clearCart();
      setCustomerName('');
      setSelectedTable(null);
      setActiveTab('manage');
    } catch (err) {
      alert(err.response?.data?.error || 'ትዕዛዙ አልተሳካም');
    }
  };

  const updateStatus = async (id, currentStatus, nextStatus, paymentMethod = null) => {
    const order = orders.find(o => o.id === id);
    if (currentStatus === 'READY' && nextStatus !== 'DONE') {
      setPaymentOrder(order);
      return;
    }

    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/status`, 
        { status: nextStatus, paymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPaymentOrder(null);
    } catch (err) {
      alert('ያልተፈቀደ እርምጃ');
    }
  };

  const categories = ['All', ...new Set(menu.map(item => item.category))];
  const filteredMenu = category === 'All' ? menu : menu.filter(item => item.category === category);

  if (!token) return <div className="text-center py-40 glass m-10 rounded-[40px] font-black text-black/10 uppercase tracking-widest text-2xl">እባክዎን መጀመሪያ ይግቡ • LOGIN REQUIRED</div>;

  return (
    <div className="space-y-10 pb-32 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-2">
          <h2 className="text-5xl font-serif font-black tracking-tightest text-[#120B05]">{config?.cafeNameAmharic || 'አስተናጋጅ'} (Service)</h2>
          <p className="text-[10px] uppercase tracking-widest font-black italic" style={{ color: config?.primaryColor || '#D49E4A' }}>
            Waitstaff Control Interface
          </p>
        </div>
        
        <div className="flex bg-black/5 p-1.5 rounded-3xl backdrop-blur-xl border-0.5 border-black/5">
          <button 
            onClick={() => setActiveTab('new')}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'new' ? 'bg-[#120B05] text-white shadow-xl' : 'text-black/40 hover:text-black'
            }`}
          >
            <ShoppingCart size={14} /> አዲስ ትዕዛዝ (New)
          </button>
          <button 
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'manage' ? 'bg-[#120B05] text-white shadow-xl' : 'text-black/40 hover:text-black'
            }`}
          >
            <ClipboardList size={14} /> ማስተዳደር (Manage)
            {orders.filter(o => o.status === 'READY').length > 0 && (
              <span className="w-5 h-5 text-white flex items-center justify-center rounded-full text-[8px] animate-pulse" style={{ backgroundColor: config?.primaryColor || '#D49E4A' }}>
                {orders.filter(o => o.status === 'READY').length}
              </span>
            )}
          </button>
        </div>
      </header>

      {activeTab === 'new' ? (
        !selectedTable ? (
          <div className="animate-fade-in space-y-8 pt-4">
            <div className="text-center space-y-2 mb-12">
              <h3 className="text-3xl font-serif font-black">ጠረጴዛ ይምረጡ</h3>
              <p className="text-[10px] uppercase font-black tracking-[0.2em]" style={{ color: config?.primaryColor || '#D49E4A' }}>
                Step 1: Select a Table to Begin Service
              </p>
            </div>
            <TableGrid tables={tables} onTableClick={(t) => {
              if (t.status === 'OCCUPIED') {
                const activeOrder = orders.find(o => o.tableId === t.id);
                if (activeOrder) {
                  alert(`Table #${t.number} is occupied by ${activeOrder.customer || 'Guest'}`);
                }
              } else if (t.status === 'AVAILABLE') {
                setSelectedTable(t);
              }
            }} />
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
          <div className="lg:col-span-2 space-y-10">
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap shadow-sm border-0.5 ${
                    category === c ? 'bg-[#120B05] text-white' : 'glass text-black/40 border-black/5'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMenu.map(item => (
                <div key={item.id} className="glass p-6 rounded-[35px] border-0.5 border-black/5 flex items-center gap-6 group hover:shadow-2xl transition-all cursor-pointer" onClick={() => addItem(item)}>
                  <div className="text-4xl bg-black/5 w-20 h-20 flex items-center justify-center rounded-3xl group-hover:scale-110 transition-transform">{item.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-black text-lg text-[#120B05]">{item.name}</h3>
                    <p className="text-[10px] text-black/30 font-black uppercase tracking-widest">{item.category}</p>
                    <p className="font-serif font-black mt-2" style={{ color: config?.primaryColor || '#D49E4A' }}>{formatETB(item.price)}</p>
                  </div>
                  <div className="w-10 h-10 bg-[#120B05] text-white rounded-2xl flex items-center justify-center font-black opacity-0 group-hover:opacity-100 transition-all">+</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 hidden lg:block">
            <div className="glass p-8 rounded-[40px] sticky top-8 border-0.5 border-black/5 shadow-2xl space-y-8">
              <div className="flex justify-between items-center border-b border-black/5 pb-6">
                <h3 className="font-black text-xl text-[#120B05]">የእቃ መያዣ (Cart)</h3>
                <span className="text-[10px] text-white px-3 py-1 rounded-full font-black uppercase tracking-widest" style={{ backgroundColor: config?.primaryColor || '#D49E4A' }}>
                  {cart.length} ITEMS
                </span>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-black/20 text-[10px] font-black uppercase tracking-widest">ባዶ ነው • CART EMPTY</div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-black/5 p-4 rounded-2xl border-0.5 border-black/5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <p className="text-xs font-black text-[#120B05]">{item.name}</p>
                          <p className="text-[9px] text-black/40 font-bold">{formatETB(item.price)}</p>
                        </div>
                      </div>
                      <span className="font-black text-[10px] bg-[#120B05] text-white w-8 h-8 flex items-center justify-center rounded-xl">x{item.quantity}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-4 border-t border-black/5 pt-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={16} />
                    <input 
                      type="text" 
                      placeholder="የደንበኛ ስም (Customer Name - Optional)" 
                      className="w-full bg-black/5 border-0.5 border-black/5 rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:border-[#D49E4A] transition-all font-bold"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                    />
                  </div>
                  
                  <div className="bg-black/5 rounded-2xl p-4 flex items-center justify-between border-0.5 border-black/5">
                    <div className="flex items-center gap-3">
                      <LayoutGrid size={16} style={{ color: config?.primaryColor || '#D49E4A' }} />
                      <div>
                        <p className="text-[8px] uppercase font-black text-black/30">Selected Table</p>
                        <p className="text-sm font-black text-[#120B05]">{selectedTable ? `Table #${selectedTable.number}` : 'None'}</p>
                      </div>
                    </div>
                    {selectedTable && (
                      <button onClick={() => setSelectedTable(null)} className="text-[8px] font-black uppercase text-red-400">Change</button>
                    )}
                  </div>
                </div>

                {!selectedTable && (
                  <div className="bg-amber-500/10 p-4 rounded-2xl text-amber-600 text-[10px] font-black uppercase tracking-tighter text-center">
                    Please select a table from the grid first
                  </div>
                )}

                <div className="flex justify-between items-end pt-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/30">ጠቅላላ (Total)</span>
                  <span className="text-3xl font-serif font-black text-[#120B05]">
                    {formatETB(cart.reduce((s, i) => s + i.price * i.quantity, 0))}
                  </span>
                </div>

                <button 
                  onClick={placeOrder}
                  disabled={cart.length === 0 || !selectedTable}
                  className="w-full py-5 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all active:scale-95 shadow-xl disabled:opacity-50"
                  style={{ backgroundColor: config?.primaryColor || '#120B05' }}
                >
                  ትዕዛዝ ያስገቡ (Place Order)
                </button>
              </div>
            </div>
          </div>
        </div>
        )
      ) : (
        <div className="animate-fade-in space-y-10">
          <TableGrid tables={tables} onTableClick={(t) => t.status === 'AVAILABLE' && setSelectedTable(t)} activeTableId={selectedTable?.id} />
        </div>
      )}


      {paymentOrder && (
        <PaymentModal 
          order={paymentOrder} 
          onClose={() => setPaymentOrder(null)} 
          onPaymentComplete={() => {
            setPaymentOrder(null);
          }} 
        />
      )}

      {/* ── MOBILE FLOATING CART BUTTON ── */}
      {activeTab === 'new' && cart.length > 0 && selectedTable && (
        <button 
          onClick={() => setMobileCartOpen(true)}
          className="lg:hidden fixed bottom-8 right-8 w-16 h-16 rounded-full text-white shadow-2xl z-50 flex items-center justify-center animate-bounce-subtle"
          style={{ backgroundColor: config?.primaryColor || '#120B05' }}
        >
          <ShoppingCart size={24} />
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-black">
            {cart.length}
          </span>
        </button>
      )}

      {/* ── MOBILE CART BOTTOM SHEET ── */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileCartOpen(false)}></div>
          <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[50px] p-8 shadow-2xl animate-slide-up space-y-8">
            <div className="flex justify-between items-center border-b border-black/5 pb-6">
              <h3 className="font-black text-xl text-[#120B05]">የእቃ መያዣ (Cart)</h3>
              <button onClick={() => setMobileCartOpen(false)} className="text-black/20 hover:text-red-500">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-black/5 p-4 rounded-2xl border-0.5 border-black/5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-xs font-black text-[#120B05]">{item.name}</p>
                      <p className="text-[9px] text-black/40 font-bold">{formatETB(item.price)}</p>
                    </div>
                  </div>
                  <span className="font-black text-[10px] bg-[#120B05] text-white w-8 h-8 flex items-center justify-center rounded-xl">x{item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-6 pt-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={16} />
                <input 
                  type="text" 
                  placeholder="የደንበኛ ስም (Customer Name - Optional)" 
                  className="w-full bg-black/5 border-0.5 border-black/5 rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:border-[#D49E4A] transition-all font-bold"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>

              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-black/30">ጠቅላላ (Total)</span>
                <span className="text-3xl font-serif font-black text-[#120B05]">
                  {formatETB(cart.reduce((s, i) => s + i.price * i.quantity, 0))}
                </span>
              </div>

              <button 
                onClick={() => {
                  placeOrder();
                  setMobileCartOpen(false);
                }}
                className="w-full py-6 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95"
                style={{ backgroundColor: config?.primaryColor || '#120B05' }}
              >
                ትዕዛዝ ያስገቡ (Place Order)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterView;
