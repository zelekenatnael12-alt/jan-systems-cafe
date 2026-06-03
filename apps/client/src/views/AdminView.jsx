// apps/client/src/views/AdminView.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore, formatETB } from '../store/useStore';
import { Edit2, Trash2, Search, Plus, Save, X, Coffee, ShieldCheck, CreditCard, Receipt, UserPlus, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import TableGrid from '../components/TableGrid';
import PaymentModal from '../components/PaymentModal';
import ShiftManager from '../components/ShiftManager';
import ShiftCloseModal from '../components/ShiftCloseModal';
import ZReport from '../components/ZReport';
import AlertsWidget from '../components/AlertsWidget';

const AdminView = () => {
  const { setView } = useStore();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('jan_token'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState({ revenue: 0, totalOrders: 0, lowStockCount: 0 });
  const [inventory, setInventory] = useState([]);
  const [menu, setMenu] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('አስተዳደር (Dashboard)');
  const [auditItem, setAuditItem] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  
  // Registration & Editing State
  const [regForm, setRegForm] = useState({ name: '', amount: '', unit: 'kg', threshold: '', costPerUnit: '' });
  const [prodForm, setProdForm] = useState({ 
    name: '', 
    price: '', 
    category: 'Coffee', 
    icon: '☕', 
    image: null,
    ingredients: [] 
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [dayReport, setDayReport] = useState(null);
  const [selectedShiftReport, setSelectedShiftReport] = useState(null);
  const [closingShift, setClosingShift] = useState(null);
  const [voidingOrder, setVoidingOrder] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  
  // Table Editor State
  const [editingTable, setEditingTable] = useState(null);
  const [tableForm, setTableForm] = useState({ number: '', zone: 'MAIN', seats: 4, status: 'AVAILABLE' });

  const token = localStorage.getItem('jan_token');
  const headers = { Authorization: `Bearer ${token}` };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { email, password });
      localStorage.setItem('jan_token', res.data.token);
      localStorage.setItem('jan_refresh_token', res.data.refreshToken);
      localStorage.setItem('jan_user', JSON.stringify(res.data.user));
      setIsLoggedIn(true);
    } catch (err) {
      alert('መግባት አልተሳካም (Login failed)');
    }
  };

  const fetchData = async () => {
    if (!isLoggedIn) return;
    try {
      const [iRes, sRes, lRes, mRes, intelRes, oRes, tRes, dRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/inventory`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/stats`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/inventory/logs`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/menu`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/intelligence/calibrate`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/orders`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/tables`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/day-report`, { headers })
      ]);
      setInventory(iRes.data);
      setStats(sRes.data);
      setLogs(lRes.data);
      setMenu(mRes.data);
      setSuggestions(intelRes.data);
      setOrders(oRes.data);
      setTables(tRes.data);
      setDayReport(dRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isLoggedIn, activeTab]);

  const applyCalibration = (suggestion) => {
    updateIngredientQty(suggestion.stockItemId, suggestion.suggestedQuantity);
  };

  const handleAuditSubmit = async (e) => {
    e.preventDefault();
    const newAmount = parseFloat(e.target.amount.value);
    const reason = e.target.reason.value;
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/inventory/${auditItem.id}`, { amount: newAmount, reason }, { headers });
      setAuditItem(null);
      fetchData();
      alert('ተስተካክሏል! (Adjusted!)');
    } catch (err) {
      alert('ማስተካከል አልተሳካም');
    }
  };

  const handleRegisterInventory = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/inventory`, {
        ...regForm,
        amount: parseFloat(regForm.amount),
        threshold: parseFloat(regForm.threshold),
        costPerUnit: parseFloat(regForm.costPerUnit)
      }, { headers });
      setRegForm({ name: '', amount: '', unit: 'kg', threshold: '', costPerUnit: '' });
      fetchData();
      alert('ተመዝግቧል! (Registered!)');
    } catch (err) {
      alert('ምዝገባ አልተሳካም');
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...prodForm,
        price: parseFloat(prodForm.price),
        ingredients: prodForm.ingredients.map(ing => ({
          stockItemId: ing.stockItemId,
          quantity: parseFloat(ing.quantity) || 0
        }))
      };
      
      if (editingProduct) {
        await axios.patch(`${import.meta.env.VITE_API_URL}/api/menu/${editingProduct.id}`, data, { headers });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/menu`, data, { headers });
      }
      
      setProdForm({ 
        name: '', 
        price: '', 
        category: 'Coffee', 
        icon: '☕', 
        image: null,
        ingredients: [] 
      });
      setEditingProduct(null);
      fetchData();
      alert('ተቀምጧል! (Saved!)');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'ማስቀመጥ አልተሳካም');
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('እርግጠኛ ነዎት? (Are you sure?)')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/menu/${id}`, { headers });
      fetchData();
    } catch (err) {
      alert('መሰረዝ አልተሳካም');
    }
  };

  const handleVoidOrder = async (e) => {
    e.preventDefault();
    if (!voidReason) return alert('ምክንያት ያስፈልጋል (Reason required)');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/orders/${voidingOrder.id}/void`, { reason: voidReason }, { headers });
      setVoidingOrder(null);
      setVoidReason('');
      fetchData();
      alert('ትዕዛዙ ተሰርዟል! (Order Voided!)');
    } catch (err) {
      alert(err.response?.data?.error || 'መሰረዝ አልተሳካም');
    }
  };

  const addIngredientToProduct = (stockItemId) => {
    if (prodForm.ingredients.find(i => i.stockItemId === stockItemId)) return;
    setProdForm({
      ...prodForm,
      ingredients: [...prodForm.ingredients, { stockItemId, quantity: 0.1 }]
    });
  };

  const updateIngredientQty = (stockItemId, quantity) => {
    setProdForm({
      ...prodForm,
      ingredients: prodForm.ingredients.map(i => 
        i.stockItemId === stockItemId ? { ...i, quantity: quantity } : i
      )
    });
  };

  const removeIngredientFromProduct = (stockItemId) => {
    setProdForm({
      ...prodForm,
      ingredients: prodForm.ingredients.filter(i => i.stockItemId !== stockItemId)
    });
  };

  const handleSaveTable = async (e) => {
    e.preventDefault();
    try {
      const data = { ...tableForm, number: parseInt(tableForm.number), seats: parseInt(tableForm.seats) };
      if (editingTable) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/tables/${editingTable.id}`, data, { headers });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/tables`, data, { headers });
      }
      setTableForm({ number: '', zone: 'MAIN', seats: 4, status: 'AVAILABLE' });
      setEditingTable(null);
      fetchData();
      alert('Table saved successfully');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save table');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto bg-white p-10 rounded-2xl shadow-2xl border-0.5 border-espresso/5 relative">
        <button 
          onClick={() => setView('landing')}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 text-[#120B05] transition-all duration-300 flex items-center justify-center"
          title="Back to Landing Page"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-3xl font-serif font-bold mb-2 tracking-tight text-espresso">ሠራተኛ መግቢያ</h2>
        <p className="text-gray-400 text-xs mb-8 uppercase tracking-widest font-bold">Secure Staff Portal</p>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-black text-espresso/40 mb-2">ኢሜይል (Email)</label>
            <input 
              type="email" 
              className="w-full bg-cream border-0.5 border-espresso/10 rounded-xl px-4 py-4 focus:outline-none focus:border-amber transition-all"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-black text-espresso/40 mb-2">የይለፍ ቃል (Password)</label>
            <input 
              type="password" 
              className="w-full bg-cream border-0.5 border-espresso/10 rounded-xl px-4 py-4 focus:outline-none focus:border-amber transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button className="w-full py-5 bg-espresso text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber transition-all active:scale-95 shadow-lg">
            ዳሽቦርድ ይግቡ (Login)
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-8 p-6 rounded-2xl bg-amber/10 border border-amber/20 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber mb-2">Demo Access (የሙከራ መግቢያ)</p>
          <p className="text-[11px] text-espresso opacity-70">Email: <strong>admin@jan.com</strong></p>
          <p className="text-[11px] text-espresso opacity-70 mb-4">Password: <strong>password123</strong></p>
          <button 
            type="button"
            onClick={async () => {
              try {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { 
                  email: 'admin@jan.com', 
                  password: 'password123' 
                });
                localStorage.setItem('jan_token', res.data.token);
                localStorage.setItem('jan_refresh_token', res.data.refreshToken);
                localStorage.setItem('jan_user', JSON.stringify(res.data.user));
                localStorage.setItem('jan_venue_slug', 'demo-cafe');
                setIsLoggedIn(true);
              } catch (err) { alert('Demo Login failed'); }
            }}
            className="w-full py-4 bg-amber text-espresso hover:bg-espresso hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
          >
            Quick Login (በቀጥታ ግባ)
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-espresso/10 text-center">
          <button 
            onClick={() => setView('landing')}
            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-amber transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft size={12} /> ወደ ዋናው ገጽ ይመለሱ (Back to Home)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-serif font-bold tracking-tightest text-espresso">አስተዳደር (Admin)</h2>
          <div className="flex overflow-x-auto no-scrollbar gap-6 mt-6 pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
            {[
              { id: 'አስተዳደር (Dashboard)', am: 'አስተዳደር' },
              { id: 'ትዕዛዞች (Orders)', am: 'ትዕዛዞች' },
              { id: 'ጠረጴዛዎች (Tables)', am: 'ጠረጴዛዎች' },
              { id: 'ሪፖርቶች (Reports)', am: 'ሪፖርቶች' },
              { id: 'ክምችት (Inventory)', am: 'ክምችት' },
              { id: 'ምዝግብ (Log)', am: 'ምዝግብ' },
              { id: 'ምናሌ (Menu)', am: 'ምናሌ' }
            ].map(t => (
              <button 
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`text-[10px] font-black uppercase tracking-widest min-h-[44px] whitespace-nowrap border-b-4 transition-all ${
                  activeTab === t.id ? 'border-amber text-espresso' : 'border-transparent text-gray-300 hover:text-espresso/50'
                }`}
              >
                <span className="md:hidden">{t.am}</span>
                <span className="hidden md:inline">{t.id}</span>
              </button>
            ))}
          </div>
        </div>
        <button 
          onClick={() => { localStorage.clear(); setIsLoggedIn(false); }}
          className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-0.5 border-red-100 hover:bg-red-500 hover:text-white transition-all"
        >
          ውጣ (Logout)
        </button>
      </header>

      <AlertsWidget />

      {activeTab === 'አስተዳደር (Dashboard)' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'ጠቅላላ ገቢ (Revenue)', value: formatETB(stats.revenue), color: 'bg-cream border-espresso/5 text-espresso' },
            { label: 'ትዕዛዞች (Orders)', value: stats.totalOrders, color: 'bg-softBlue/30 border-blue-100 text-blue-600' },
            { label: 'ያነሰ ክምችት (Low Stock)', value: stats.lowStockCount, color: stats.lowStockCount > 0 ? 'bg-red-50 border-red-100 text-red-600 animate-pulse' : 'bg-softGreen/30 border-green-100 text-green-600' },
            { label: 'የክምችት ዋጋ (Stock Value)', value: formatETB((inventory || []).reduce((s, i) => s + (i.amount * i.costPerUnit), 0)), color: 'bg-cream border-espresso/5 text-espresso' }
          ].map((card, i) => (
            <div key={i} className={`p-8 rounded-2xl border-0.5 shadow-sm ${card.color}`}>
              <span className="text-[10px] uppercase tracking-widest font-black opacity-60 block mb-2">{card.label}</span>
              <div className="text-4xl font-serif font-bold tracking-tightest">{card.value}</div>
            </div>
          ))}
        </div>
      )}
      
      {activeTab === 'ትዕዛዞች (Orders)' && (
        <div className="bg-white rounded-2xl border-0.5 border-espresso/5 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-espresso text-white">
              <tr>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest font-black">ትዕዛዝ (Order)</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest font-black">ደንበኛ (Customer)</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest font-black">ሁኔታ (Status)</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest font-black">ዋጋ (Total)</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest font-black">እርምጃ (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5">
              {orders.map(order => (
                <tr key={order.id} className={`hover:bg-cream/50 transition-all ${order.status === 'VOIDED' ? 'bg-red-50/30 opacity-60' : ''}`}>
                  <td className="px-6 py-5">
                    <div className="font-bold text-espresso tracking-tight">#{order.id.slice(-6)}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">{new Date(order.createdAt).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-espresso">{order.customer}</div>
                    <div className="text-[9px] text-gray-400 uppercase">
                      {order.items.map(i => `${i.product.name} x${i.quantity}`).join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      order.status === 'DONE' ? 'bg-green-100 text-green-600' : 
                      order.status === 'VOIDED' ? 'bg-red-100 text-red-600' : 
                      order.status === 'CANCELLED' ? 'bg-gray-100 text-gray-400' :
                      'bg-blue-50 text-blue-500'
                    }`}>
                      {order.status}
                    </span>
                    {order.status === 'VOIDED' && (
                      <div className="text-[8px] text-red-400 mt-1 italic">Reason: {order.voidReason}</div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-serif font-black text-espresso">{formatETB(order.total)}</div>
                  </td>
                  <td className="px-6 py-5">
                    {order.status === 'DONE' && (
                      <button 
                        onClick={() => setVoidingOrder(order)}
                        className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
                      >
                        Void (ሰርዝ)
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'ክምችት (Inventory)' && (
        <div className="space-y-12">
          {/* Registration Form */}
          <section className="bg-white p-8 rounded-2xl border-0.5 border-espresso/5 shadow-lg">
            <h3 className="text-xl font-bold mb-6 tracking-tight">አዲስ ክምችት ይመዝግቡ (Inventory Registration)</h3>
            <form onSubmit={handleRegisterInventory} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <input 
                type="text" placeholder="ስም (Name)" required
                className="bg-cream border-0.5 border-espresso/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber"
                value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})}
              />
              <input 
                type="number" placeholder="ብዛት (Qty)" required
                className="bg-cream border-0.5 border-espresso/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber"
                value={regForm.amount} onChange={e => setRegForm({...regForm, amount: e.target.value})}
              />
              <select 
                className="bg-cream border-0.5 border-espresso/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber"
                value={regForm.unit} onChange={e => setRegForm({...regForm, unit: e.target.value})}
              >
                <option value="kg">kg</option>
                <option value="L">Litres</option>
                <option value="units">Units</option>
              </select>
              <input 
                type="number" placeholder="መቀነስያ (Threshold)" required
                className="bg-cream border-0.5 border-espresso/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber"
                value={regForm.threshold} onChange={e => setRegForm({...regForm, threshold: e.target.value})}
              />
              <input 
                type="number" placeholder="ዋጋ (Cost/Unit)" required
                className="bg-cream border-0.5 border-espresso/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber"
                value={regForm.costPerUnit} onChange={e => setRegForm({...regForm, costPerUnit: e.target.value})}
              />
              <button className="lg:col-span-5 py-4 bg-amber text-espresso font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-espresso hover:text-white transition-all shadow-md">
                ይመዝግቡ (Register Item)
              </button>
            </form>
          </section>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-espresso text-white p-6 rounded-2xl">
              <p className="text-[9px] uppercase tracking-widest opacity-40 font-black mb-2">ከፍተኛ ፍጆታ (High Usage)</p>
              <div className="text-xl font-bold">
                {[...inventory].sort((a, b) => (b.avgDailyUsage || 0) - (a.avgDailyUsage || 0))[0]?.name || 'N/A'}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border-0.5 border-espresso/5">
              <p className="text-[9px] uppercase tracking-widest text-espresso/40 font-black mb-2">በጣም ያነሰ (Most Critical)</p>
              <div className="text-xl font-bold text-red-500">
                {inventory.filter(i => i.amount <= i.threshold).sort((a, b) => {
                  const ratioA = a.threshold > 0 ? a.amount / a.threshold : 0;
                  const ratioB = b.threshold > 0 ? b.amount / b.threshold : 0;
                  return ratioA - ratioB;
                })[0]?.name || 'None'}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border-0.5 border-espresso/5">
              <p className="text-[9px] uppercase tracking-widest text-espresso/40 font-black mb-2">የክምችት አይነቶች (Stock Types)</p>
              <div className="text-xl font-bold text-espresso">{inventory.length} Categories</div>
            </div>
            <div className="bg-amber p-6 rounded-2xl shadow-lg">
              <p className="text-[9px] uppercase tracking-widest text-espresso/60 font-black mb-2">ቀጣይ ግዢ (Next Purchase)</p>
              <div className="text-xl font-bold text-espresso">
                {[...inventory].sort((a, b) => (a.projectedDays || 999) - (b.projectedDays || 999))[0]?.name || 'N/A'}
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-2xl shadow-sm border-0.5 border-espresso/5 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-espresso text-white">
                <tr>
                  <th className="px-6 py-5 text-[10px] uppercase tracking-widest font-black">ክምችት (Item)</th>
                  <th className="px-6 py-5 text-[10px] uppercase tracking-widest font-black">ብዛት (Level)</th>
                  <th className="px-6 py-5 text-[10px] uppercase tracking-widest font-black">ተንባይ (Projection)</th>
                  <th className="px-6 py-5 text-[10px] uppercase tracking-widest font-black">ሁኔታ (Status)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5">
                {inventory.map(item => (
                  <tr key={item.id} className={`hover:bg-cream/50 transition-all ${item.amount <= item.threshold ? 'bg-red-50/50' : ''}`}>
                    <td className="px-6 py-5">
                      <div className="font-bold text-espresso tracking-tight">{item.name}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Cost: {formatETB(item.costPerUnit)}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="text-sm font-black text-espresso">{item.amount.toFixed(2)} {item.unit}</div>
                        <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden max-w-[100px]">
                          <div 
                            className={`h-full transition-all duration-1000 ${item.amount <= item.threshold ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, (item.amount / (item.threshold * 3)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-[9px] text-gray-400 uppercase">Avg Use: {item.avgDailyUsage?.toFixed(3) || 0}/day</div>
                    </td>
                    <td className="px-6 py-5">
                      {item.projectedDays !== null ? (
                        <div className="flex items-center gap-2">
                          <Clock size={12} className={item.projectedDays <= 1 ? 'text-red-500 animate-pulse' : 'text-espresso/40'} />
                          <div className={`text-sm font-bold ${item.projectedDays <= 1 ? 'text-red-500' : 'text-espresso'}`}>
                            ~{item.projectedDays} {item.projectedDays === 0 ? 'ዛሬ ይጠናቀቃል' : 'ቀናት (days)'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300 italic">No data yet</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        {item.amount <= item.threshold ? (
                          <span className="inline-flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse w-fit">
                            ⚠ ክምችት አነስተኛ ነው
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-0.5 border-green-200 w-fit">
                            ተገቢ (Normal)
                          </span>
                        )}
                        <div className="text-[8px] font-bold text-espresso/20 uppercase">Value: {formatETB(item.amount * item.costPerUnit)}</div>
                        <button 
                          onClick={() => setAuditItem(item)}
                          className="text-[10px] font-black uppercase tracking-widest text-amber hover:text-espresso transition-colors w-fit"
                        >
                          Audit (አስተካክል)
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ጠረጴዛዎች (Tables)' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
          <div className="lg:col-span-2 space-y-10">
            <TableGrid 
              tables={tables} 
              onTableClick={(t) => {
                setEditingTable(t);
                setTableForm({ number: t.number, zone: t.zone, seats: t.seats, status: t.status });
              }} 
            />
          </div>

          <div className="lg:col-span-1">
            <section className="bg-white p-8 rounded-[35px] border-0.5 border-espresso/5 shadow-2xl sticky top-8 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold tracking-tight text-espresso">
                  {editingTable ? 'ጠረጴዛ ያርሙ (Edit)' : 'አዲስ ጠረጴዛ (Add Table)'}
                </h3>
                {editingTable && (
                  <button onClick={() => { setEditingTable(null); setTableForm({ number: '', zone: 'MAIN', seats: 4, status: 'AVAILABLE' }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X size={20} />
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveTable} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-espresso/40 mb-2">ቁጥር (Number)</label>
                    <input 
                      type="number" required
                      className="w-full bg-cream border-0.5 border-espresso/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber font-bold"
                      value={tableForm.number} onChange={e => setTableForm({...tableForm, number: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-espresso/40 mb-2">መቀመጫ (Seats)</label>
                    <input 
                      type="number" required
                      className="w-full bg-cream border-0.5 border-espresso/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber font-bold"
                      value={tableForm.seats} onChange={e => setTableForm({...tableForm, seats: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-black text-espresso/40 mb-2">መደብ (Zone)</label>
                  <select 
                    className="w-full bg-cream border-0.5 border-espresso/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber appearance-none"
                    value={tableForm.zone} onChange={e => setTableForm({...tableForm, zone: e.target.value})}
                  >
                    <option value="MAIN">Main Lounge (ዋና አዳራሽ)</option>
                    <option value="BALCONY">Balcony Terrace (በረንዳ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-black text-espresso/40 mb-2">ሁኔታ (Status)</label>
                  <select 
                    className="w-full bg-cream border-0.5 border-espresso/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber appearance-none"
                    value={tableForm.status} onChange={e => setTableForm({...tableForm, status: e.target.value})}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <button className="w-full py-5 bg-espresso text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber hover:text-espresso transition-all shadow-xl flex items-center justify-center gap-3">
                  <Save size={16} /> ጠረጴዛውን አዝምን (Save Table)
                </button>
              </form>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'ሪፖርቶች (Reports)' && (
        <div className="space-y-12 animate-fade-in">
          <ShiftManager onShiftCloseInitiated={(shift) => setClosingShift(shift)} />
          
          <div className="space-y-8">
            <h3 className="text-xl font-bold tracking-tight text-espresso flex items-center gap-3">
              <Clock size={18} /> የዛሬ ሽፍቶች (Today's Shifts)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dayReport?.shifts.map(s => (
                <div key={s.id} className="bg-white p-8 rounded-[40px] border-0.5 border-espresso/5 shadow-lg space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-lg text-espresso">{s.name}</h4>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${s.status === 'OPEN' ? 'text-green-500' : 'text-gray-400'}`}>
                        {s.status}
                      </p>
                    </div>
                    <span className="font-serif font-black text-xl text-espresso">{formatETB(s.revenue)}</span>
                  </div>
                  <button 
                    onClick={async () => {
                      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/shifts/${s.id}/report`, { headers });
                      setSelectedShiftReport(res.data);
                    }}
                    className="w-full py-3 bg-espresso/5 hover:bg-espresso text-espresso hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    View Detailed Z-Report
                  </button>
                </div>
              ))}
            </div>
          </div>

          {selectedShiftReport && (
            <div className="pt-12 border-t border-espresso/10">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-serif font-black text-espresso">Shift Detail: {selectedShiftReport.shift.name}</h3>
                <button onClick={() => setSelectedShiftReport(null)} className="text-gray-400 hover:text-espresso"><X size={24} /></button>
              </div>
              <ZReport report={selectedShiftReport} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'ምዝግብ (Log)' && (
        <div className="bg-white rounded-2xl border-0.5 border-espresso/5 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream border-b border-espresso/5">
              <tr>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">ጊዜ (Timestamp)</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">ክምችት (Item)</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">ለውጥ (Change)</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">ምክንያት (Reason)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-cream/20">
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-espresso">{log.stockItem.name}</td>
                  <td className={`px-6 py-4 font-black ${log.change < 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {log.change > 0 ? '+' : ''}{log.change.toFixed(3)} {log.stockItem.unit}
                  </td>
                  <td className="px-6 py-4 text-gray-500 italic text-xs">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'ምናሌ (Menu)' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
          {/* Product Form */}
          <div className="lg:col-span-1">
            <section className="bg-white p-8 rounded-[35px] border-0.5 border-espresso/5 shadow-2xl sticky top-8 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold tracking-tight text-espresso">
                  {editingProduct ? 'ምናሌ ያርሙ (Edit)' : 'አዲስ ምናሌ (Add Item)'}
                </h3>
                {editingProduct && (
                  <button onClick={() => { setEditingProduct(null); setProdForm({ name: '', price: '', category: 'Drinks', icon: '☕', ingredients: [] }); }} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X size={20} />
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <label className="block text-[10px] uppercase tracking-widest font-black text-espresso/40 mb-2">ስም (Name)</label>
                    <input 
                      type="text" required
                      className="w-full bg-cream border-0.5 border-espresso/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber"
                      value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-espresso/40 mb-2">ምልክት</label>
                    <input 
                      type="text" required
                      className="w-full bg-cream border-0.5 border-espresso/10 rounded-xl px-4 py-3 text-center text-xl focus:outline-none focus:border-amber"
                      value={prodForm.icon} onChange={e => setProdForm({...prodForm, icon: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-espresso/40 mb-2">ዋጋ (Price)</label>
                    <input 
                      type="number" required
                      className="w-full bg-cream border-0.5 border-espresso/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber font-bold"
                      value={prodForm.price} onChange={e => setProdForm({...prodForm, price: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-espresso/40 mb-2">መደብ (Category)</label>
                    <select 
                      className="w-full bg-cream border-0.5 border-espresso/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber appearance-none"
                      value={prodForm.category} onChange={e => setProdForm({...prodForm, category: e.target.value})}
                    >
                      {['Drinks', 'Food', 'Snacks', 'Special'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] uppercase tracking-widest font-black text-espresso/40 ml-2">Product Image (Optional)</label>
                  <ImageUploader 
                    onUpload={(url) => setProdForm({ ...prodForm, image: url })} 
                    initialImage={prodForm.image ? `${import.meta.env.VITE_API_URL}${prodForm.image}` : null} 
                  />
                </div>

                {/* Ingredients Mapping */}
                <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] uppercase tracking-widest font-black text-espresso/40">ጥሬ እቃዎች (Ingredients)</label>
                    <LinkIcon size={12} className="text-amber" />
                  </div>
                  
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 no-scrollbar">
                    {prodForm.ingredients.map(ing => {
                      const item = inventory.find(i => i.id === ing.stockItemId);
                      return (
                        <div key={ing.stockItemId} className="flex-1 space-y-3 bg-cream p-3 rounded-xl border-0.5 border-espresso/5">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black uppercase text-espresso/40">{item?.name}</span>
                            {suggestions.find(s => s.productId === editingProduct?.id && s.stockItemId === ing.stockItemId) && (
                              <button 
                                type="button"
                                onClick={() => applyCalibration(suggestions.find(s => s.productId === editingProduct?.id && s.stockItemId === ing.stockItemId))}
                                className="flex items-center gap-2 bg-amber/10 text-amber px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-amber hover:text-espresso transition-all border-0.5 border-amber/20 animate-pulse"
                              >
                                ✨ AI Learn: {suggestions.find(s => s.productId === editingProduct?.id && s.stockItemId === ing.stockItemId).suggestedQuantity}
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex-1 relative">
                              <input 
                                type="number" step="0.001"
                                value={ing.quantity}
                                onChange={(e) => updateIngredientQty(ing.stockItemId, e.target.value)}
                                className="w-full bg-white border-0.5 border-espresso/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-amber transition-all font-bold pr-12"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-espresso/20 uppercase">{item?.unit}</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => removeIngredientFromProduct(ing.stockItemId)}
                              className="text-red-400 hover:text-red-600 p-2"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <select 
                    className="w-full bg-espresso/5 border-0.5 border-dashed border-espresso/20 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-espresso/40 focus:outline-none"
                    onChange={(e) => addIngredientToProduct(e.target.value)}
                    value=""
                  >
                    <option value="">+ ጥሬ እቃ ይጨምሩ (Add Ingredient)</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <button className="w-full py-5 bg-espresso text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber hover:text-espresso transition-all shadow-xl flex items-center justify-center gap-3">
                  <Save size={16} /> ምናሌውን አዝምን (Save Product)
                </button>
              </form>
            </section>
          </div>

          {/* Product List */}
          <div className="lg:col-span-2 space-y-8">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="text" 
                placeholder="ምናሌ ይፈልጉ... (Search menu)"
                className="w-full bg-white border-0.5 border-espresso/5 rounded-[30px] pl-16 pr-8 py-5 text-sm focus:outline-none focus:shadow-xl transition-all shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {menu.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                <div key={product.id} className="bg-white p-6 rounded-[35px] border-0.5 border-espresso/5 shadow-lg group hover:shadow-2xl transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber/10 transition-all"></div>
                  
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative w-20 h-20 bg-cream flex items-center justify-center rounded-[25px] overflow-hidden group-hover:scale-110 transition-transform">
                      {product.image ? (
                        <img src={`${import.meta.env.VITE_API_URL}${product.image}`} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">{product.icon}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-espresso tracking-tight">{product.name}</h4>
                      <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">{product.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-espresso/5 pt-6">
                    <div className="font-serif font-black text-2xl text-espresso">{formatETB(product.price)}</div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingProduct(product);
                          setProdForm({
                            name: product.name,
                            price: product.price,
                            category: product.category,
                            icon: product.icon,
                            image: product.image,
                            ingredients: product.ingredients.map(i => ({ stockItemId: i.stockItemId, quantity: i.quantity }))
                          });
                        }}
                        className="w-10 h-10 bg-cream text-espresso rounded-xl flex items-center justify-center hover:bg-amber transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {product.ingredients.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {product.ingredients.map(ing => (
                        <span key={ing.id} className="text-[8px] bg-black/5 px-2 py-1 rounded-md font-black uppercase text-gray-400">
                          {ing.stockItem.name} {ing.quantity}{ing.stockItem.unit}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Audit Modal */}
      {auditItem && (
        <div className="fixed inset-0 bg-espresso/90 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-fade-in">
          <div className="bg-white w-full max-w-md p-10 rounded-[50px] shadow-2xl space-y-8 border-0.5 border-white/20">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-serif font-bold tracking-tight text-espresso">{auditItem.name} አስተካክል</h3>
              <p className="text-[10px] uppercase tracking-widest text-amber font-black italic">Stock Level Adjustment Audit</p>
            </div>
            
            <form onSubmit={handleAuditSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-espresso/40 mb-2">አዲስ መጠን (New Amount) - in {auditItem.unit}</label>
                <input 
                  name="amount" type="number" step="0.001" required
                  defaultValue={auditItem.amount}
                  className="w-full bg-cream border-0.5 border-espresso/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-amber transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-espresso/40 mb-2">ምክንያት (Reason)</label>
                <textarea 
                  name="reason" required
                  placeholder="e.g. Weekly restock, Spillage, Error correction..."
                  className="w-full bg-cream border-0.5 border-espresso/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-amber transition-all h-24 resize-none"
                ></textarea>
              </div>
              <button className="w-full py-5 bg-espresso text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-amber transition-all active:scale-95 shadow-2xl">
                አረጋግጥና አስቀምጥ (Confirm Audit)
              </button>
              <button type="button" onClick={() => setAuditItem(null)} className="w-full text-[10px] text-espresso/20 font-black uppercase tracking-widest hover:text-espresso transition-colors">ተመለስ (Cancel)</button>
            </form>
          </div>
        </div>
      )}

      {/* Void Modal */}
      {voidingOrder && (
        <div className="fixed inset-0 bg-espresso/90 backdrop-blur-md flex items-center justify-center p-6 z-[110] animate-fade-in">
          <div className="bg-white w-full max-w-md p-10 rounded-[50px] shadow-2xl space-y-8 border-0.5 border-white/20">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-serif font-bold tracking-tight text-espresso">ትዕዛዝ # {voidingOrder.id.slice(-6)} ሰርዝ</h3>
              <p className="text-[10px] uppercase tracking-widest text-red-500 font-black italic">Void Order & Return Inventory</p>
            </div>
            
            <form onSubmit={handleVoidOrder} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-espresso/40 mb-2">ምክንያት (Void Reason)</label>
                <textarea 
                  required
                  placeholder="ለምሳሌ፡ በስህተት የገባ፣ ደንበኛው ቀየረ..."
                  className="w-full bg-cream border-0.5 border-espresso/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-amber transition-all h-24 resize-none"
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                ></textarea>
              </div>
              <button className="w-full py-5 bg-red-500 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all active:scale-95 shadow-2xl">
                አረጋግጥና ሰርዝ (Confirm Void)
              </button>
              <button type="button" onClick={() => { setVoidingOrder(null); setVoidReason(''); }} className="w-full text-[10px] text-espresso/20 font-black uppercase tracking-widest hover:text-espresso transition-colors">ተመለስ (Cancel)</button>
            </form>
          </div>
        </div>
      )}

      {/* Shift Close Modal */}
      {closingShift && (
        <ShiftCloseModal 
          shift={closingShift} 
          onClose={() => setClosingShift(null)} 
          onShiftClosed={() => {
            setClosingShift(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default AdminView;

