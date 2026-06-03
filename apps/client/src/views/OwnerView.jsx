// apps/client/src/views/OwnerView.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatETB } from '../store/useStore';
import { Clock, X, ShieldCheck, Save } from 'lucide-react';
import ShiftManager from '../components/ShiftManager';
import ShiftCloseModal from '../components/ShiftCloseModal';
import ZReport from '../components/ZReport';
import AlertsWidget from '../components/AlertsWidget';

const OwnerView = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('jan_token'));
  const [briefing, setBriefing] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [payments, setPayments] = useState(null);
  const [margins, setMargins] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [settings, setSettings] = useState({});
  const [users, setUsers] = useState([]);
  const [dayReport, setDayReport] = useState(null);
  const [selectedShiftReport, setSelectedShiftReport] = useState(null);
  const [closingShift, setClosingShift] = useState(null);
  const [activeTab, setActiveTab] = useState('Briefing');
  const [efyReport, setEfyReport] = useState(null);
  const [ercaForm, setErcaForm] = useState({ tin: '', vatNumber: '', fiscalDeviceId: '', taxpayerCategory: 'B' });
  const [ercaSaved, setErcaSaved] = useState(false);

  const token = localStorage.getItem('jan_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    if (!isLoggedIn) return;
    try {
      const [bRes, rRes, pRes, mRes, aRes, uRes, dRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/owner/briefing`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/owner/revenue`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/owner/payments`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/owner/margins`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/owner/alerts`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/owner/users`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/day-report`, { headers }).catch(() => ({ data: null }))
      ]);
      setBriefing(bRes.data);
      setRevenueData(rRes.data);
      setPayments(pRes.data);
      setMargins(mRes.data);
      setAlerts(aRes.data);
      setUsers(uRes.data);
      setDayReport(dRes.data);
    } catch (err) { console.error(err); }

    // EFY report (separate so it doesn't block main data)
    try {
      const efyRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/owner/efy-report`, { headers });
      setEfyReport(efyRes.data);
    } catch {}

    // ERCA config
    try {
      const cfgRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/config`, { headers });
      const c = cfgRes.data;
      if (c) setErcaForm({ tin: c.tin || '', vatNumber: c.vatNumber || '', fiscalDeviceId: c.fiscalDeviceId || '', taxpayerCategory: c.taxpayerCategory || 'B' });
    } catch {}
  };

  useEffect(() => {
    fetchData();
  }, [isLoggedIn, activeTab]);

  const updateSetting = async (key, value) => {
    await axios.patch(`${import.meta.env.VITE_API_URL}/api/owner/settings`, { [key]: value }, { headers });
    fetchData();
  };

  const saveErca = async () => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/owner/erca`, ercaForm, { headers });
      setErcaSaved(true);
      setTimeout(() => setErcaSaved(false), 2500);
    } catch { alert('Save failed'); }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const data = { email: e.target.email.value, password: e.target.password.value, name: e.target.name.value, role: e.target.role.value };
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/owner/users`, data, { headers });
      e.target.reset(); fetchData();
    } catch { alert('Registration failed'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Remove this staff member?')) return;
    try { await axios.delete(`${import.meta.env.VITE_API_URL}/api/owner/users/${id}`, { headers }); fetchData(); }
    catch { alert('Deletion failed'); }
  };

  const handleRoleChange = async (id, newRole) => {
    try { await axios.patch(`${import.meta.env.VITE_API_URL}/api/owner/users/${id}`, { role: newRole }, { headers }); fetchData(); }
    catch { alert('Update failed'); }
  };

  const getAmharicDate = () => {
    const d = new Date();
    const days = ['እሁድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'አርብ', 'ቅዳሜ'];
    const months = ['መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ'];
    return `${days[d.getDay()]}፣ ${months[d.getMonth()]} ${d.getDate()}`;
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto glass p-10 rounded-3xl shadow-2xl border-0.5 border-white/20 animate-fade-in-up">
        <h2 className="text-3xl font-serif font-black mb-2 tracking-tightest text-[#120B05]">ባለቤት መግቢያ</h2>
        <p className="text-[10px] uppercase tracking-widest text-[#D49E4A] font-bold mb-8">Secure Owner Portal</p>
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { 
              email: e.target.email.value, 
              password: e.target.password.value 
            });
            localStorage.setItem('jan_token', res.data.token);
            localStorage.setItem('jan_refresh_token', res.data.refreshToken);
            setIsLoggedIn(true);
          } catch (err) { alert('Login failed'); }
        }} className="space-y-6">
          <input name="email" type="email" placeholder="Email" className="w-full bg-white/50 border-0.5 border-black/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#D49E4A] transition-all" />
          <input name="password" type="password" placeholder="Password" className="w-full bg-white/50 border-0.5 border-black/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#D49E4A] transition-all" />
          <button className="w-full py-5 bg-[#120B05] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-[#D49E4A] transition-all">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32 max-w-xl mx-auto">
      {activeTab === 'Briefing' && briefing && (
        <div className="space-y-12 animate-fade-in-up">
          <AlertsWidget />
          {/* Morning Briefing Hero */}
          <section className="relative h-[400px] rounded-[40px] overflow-hidden shadow-2xl group">
            <img 
              src="/luxury_cafe_interior_1777882543376.png" 
              alt="Café Interior" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#120B05] via-[#120B05]/40 to-transparent"></div>
            
            <div className="absolute bottom-10 left-10 right-10 text-white">
              <p className="text-[12px] uppercase tracking-widest text-[#D49E4A] font-black mb-4 animate-steam">{getAmharicDate()}</p>
              <h3 className="text-[10px] uppercase tracking-widest font-black opacity-60 mb-2">ዛሬ የተገኘ ገቢ (Today's Revenue)</h3>
              <div className="text-6xl font-serif font-black tracking-tightest mb-8">{formatETB(briefing.todayRevenue)}</div>
              
              <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
                <div className="glass-dark p-4 rounded-2xl">
                  <span className="block text-[9px] uppercase tracking-widest opacity-40 mb-1">ከባለፈው ሳምንት</span>
                  <span className={`text-xl font-black ${briefing.comparison >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {briefing.comparison >= 0 ? '↑' : '↓'} {Math.abs(briefing.comparison)}%
                  </span>
                </div>
                <div className="glass-dark p-4 rounded-2xl">
                  <span className="block text-[9px] uppercase tracking-widest opacity-40 mb-1">የተጨናነቀ ሰዓት</span>
                  <span className="text-xl font-black text-[#D49E4A]">{briefing.busiestHour}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'Revenue' && revenueData && (
        <div className="space-y-12 animate-fade-in-up">
          <section className="glass p-8 rounded-[40px] shadow-xl border-0.5 border-black/5">
            <h4 className="text-[10px] uppercase tracking-widest font-black text-black/30 mb-8">የዛሬ ሰዓታዊ ገቢ (Hourly Revenue)</h4>
            <div className="flex items-end justify-between h-48 gap-2">
              {revenueData.hourlyRevenue.slice(8, 21).map((rev, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4">
                  <div 
                    className="w-full bg-[#D49E4A]/10 rounded-2xl hover:bg-[#D49E4A] transition-all duration-500 cursor-pointer relative group border-0.5 border-black/5"
                    style={{ height: `${Math.min(100, (rev / Math.max(...revenueData.hourlyRevenue, 1)) * 100)}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 glass-dark text-white text-[9px] px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all mb-2 z-10 whitespace-nowrap shadow-2xl">
                      {formatETB(rev)}
                    </div>
                  </div>
                  <span className="text-[10px] text-black/20 font-black">{i + 8}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="glass p-8 rounded-[40px] shadow-xl border-0.5 border-black/5">
            <h4 className="text-[10px] uppercase tracking-widest font-black text-black/30 mb-8">የክፍያ ዘዴ (Payment Adoption)</h4>
            <div className="grid grid-cols-2 gap-8">
              {Object.entries(payments || {}).map(([method, amount]) => {
                const total = Object.values(payments).reduce((s, a) => s + a, 0);
                const percent = total > 0 ? (amount / total) * 100 : 0;
                return (
                  <div key={method} className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="block text-[10px] font-black uppercase text-black/40">{method}</span>
                        <span className="text-lg font-serif font-black">{formatETB(amount)}</span>
                      </div>
                      <span className="text-[10px] font-black text-[#D49E4A]">{Math.round(percent)}%</span>
                    </div>
                    <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#120B05] transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'Staff' && (
        <div className="space-y-12 animate-fade-in-up px-2">
          {/* Register Staff Form */}
          <section className="glass p-8 rounded-[40px] shadow-xl border-0.5 border-black/5 space-y-6">
            <h4 className="text-[10px] uppercase tracking-widest font-black text-black/30">ሠራተኛ መመዝገቢያ (Register Staff)</h4>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="name" type="text" placeholder="Full Name" required className="bg-white/50 border-0.5 border-black/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#D49E4A] transition-all" />
              <input name="email" type="email" placeholder="Email Address" required className="bg-white/50 border-0.5 border-black/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#D49E4A] transition-all" />
              <input name="password" type="password" placeholder="Password" required className="bg-white/50 border-0.5 border-black/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#D49E4A] transition-all" />
              <select name="role" className="bg-white/50 border-0.5 border-black/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#D49E4A] transition-all">
                <option value="STAFF">STAFF (ሠራተኛ)</option>
                <option value="ADMIN">ADMIN (አስተዳዳሪ)</option>
              </select>
              <button className="md:col-span-2 py-5 bg-[#120B05] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-[#D49E4A] transition-all">Register Member</button>
            </form>
          </section>

          {/* User List */}
          <section className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-widest font-black text-black/30">የሠራተኞች ዝርዝር (Staff Members)</h4>
            {users.map(u => (
              <div key={u.id} className="glass p-6 rounded-3xl border-0.5 border-black/5 flex items-center justify-between shadow-lg group">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-[#120B05] text-white rounded-2xl flex items-center justify-center font-black">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-black text-sm text-[#120B05] tracking-tight">{u.name}</h5>
                    <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest">{u.role} • {u.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleRoleChange(u.id, u.role === 'ADMIN' ? 'STAFF' : 'ADMIN')}
                    className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-amber/10 text-amber rounded-full hover:bg-amber hover:text-white transition-all"
                  >
                    Change Role
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(u.id)}
                    className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {activeTab === 'Margins' && (
        <div className="space-y-4 animate-fade-in-up">
          {margins.map(m => (
            <div key={m.name} className="glass p-8 rounded-[40px] shadow-lg border-0.5 border-black/5 flex justify-between items-center group hover:bg-[#120B05] transition-all duration-500">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 glass-dark rounded-2xl flex items-center justify-center text-2xl group-hover:bg-[#D49E4A] transition-all">🏷️</div>
                <div>
                  <div className="font-black text-lg tracking-tight group-hover:text-white transition-all">{m.name}</div>
                  <div className="text-[10px] text-black/30 font-bold uppercase tracking-widest group-hover:text-white/50 transition-all">Cost: {formatETB(m.cost)} | Margin: {m.margin}%</div>
                </div>
              </div>
              <div className={`text-4xl font-serif font-black ${m.margin < 40 ? 'text-red-500' : m.margin < 60 ? 'text-[#D49E4A]' : 'text-green-500'} group-hover:text-white`}>
                {formatETB(m.price)}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className="glass p-10 rounded-[40px] shadow-2xl border-0.5 border-black/5 animate-fade-in-up space-y-10">
          <h4 className="text-[10px] uppercase tracking-widest font-black text-black/30">ማበጀት (Settings)</h4>
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-black/40 ml-2">የካፌ ስም (Café Name)</label>
              <input 
                type="text" 
                defaultValue={settings.cafe_name}
                onBlur={(e) => updateSetting('cafe_name', e.target.value)}
                className="w-full bg-white/50 border-0.5 border-black/5 rounded-2xl px-6 py-5 text-sm focus:outline-none focus:border-[#D49E4A] transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-black/40 ml-2">ክምችት ማሳሰቢያ (Alert Days)</label>
              <input 
                type="number" 
                defaultValue={settings.low_stock_alert_threshold_days}
                onBlur={(e) => updateSetting('low_stock_alert_threshold_days', e.target.value)}
                className="w-full bg-white/50 border-0.5 border-black/5 rounded-2xl px-6 py-5 text-sm focus:outline-none focus:border-[#D49E4A] transition-all"
              />
            </div>
          </div>
          <button className="w-full py-5 bg-[#D49E4A] text-[#120B05] rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-[#120B05] hover:text-white transition-all">አስቀምጥ (Save Settings)</button>
        </div>
      )}

      {activeTab === 'Reports' && (
        <div className="space-y-12 animate-fade-in-up px-2">
          <ShiftManager onShiftCloseInitiated={(shift) => setClosingShift(shift)} />
          
          <div className="space-y-8">
            <h4 className="text-[10px] uppercase tracking-widest font-black text-black/30">የዛሬ ሽፍቶች (Today's Shifts)</h4>
            <div className="grid grid-cols-1 gap-4">
              {dayReport?.shifts.map(s => (
                <div key={s.id} className="glass p-8 rounded-[40px] border-0.5 border-black/5 shadow-lg flex justify-between items-center group">
                  <div>
                    <h5 className="font-black text-lg text-[#120B05]">{s.name}</h5>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${s.status === 'OPEN' ? 'text-green-500' : 'text-black/20'}`}>
                      {s.status} • Revenue: {formatETB(s.revenue)}
                    </p>
                  </div>
                  <button 
                    onClick={async () => {
                      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/shifts/${s.id}/report`, { headers });
                      setSelectedShiftReport(res.data);
                    }}
                    className="px-6 py-3 bg-[#120B05]/5 text-[#120B05] rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#120B05] hover:text-white transition-all"
                  >
                    Details
                  </button>
                </div>
              ))}
            </div>
          </div>

          {selectedShiftReport && (
            <div className="pt-12 border-t border-black/5">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-serif font-black text-[#120B05]">{selectedShiftReport.shift.name}</h3>
                <button onClick={() => setSelectedShiftReport(null)} className="text-black/20 hover:text-[#120B05]"><X size={24} /></button>
              </div>
              <ZReport report={selectedShiftReport} />
            </div>
          )}
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

      {/* EFY Report Tab */}
      {activeTab === 'EFY' && efyReport && (
        <div className="space-y-8 animate-fade-in-up px-2">
          <div className="glass p-8 rounded-[40px] shadow-xl border-0.5 border-black/5">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-black text-black/30">የኢትዮጵያ የፊስካል ዓመት ሪፖርት</h4>
                <p className="font-serif font-black text-2xl text-[#120B05]">EFY {efyReport.efyYear} Revenue</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase font-black text-black/30">YTD Total</p>
                <p className="font-serif font-black text-xl text-[#D49E4A]">{formatETB(efyReport.totalRevenue)}</p>
              </div>
            </div>
            {/* Bar chart */}
            <div className="flex items-end gap-1.5 h-40 mt-4">
              {efyReport.months.map((m, i) => {
                const pct = efyReport.totalRevenue > 0 ? (m.revenue / efyReport.peakMonth.revenue) * 100 : 0;
                const isPeak = m.monthName === efyReport.peakMonth.monthName;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-all z-10 bg-[#120B05] text-white text-[8px] font-black px-2 py-1 rounded-lg whitespace-nowrap">
                      {m.monthName}<br/>{formatETB(m.revenue)}
                    </div>
                    <div
                      className="w-full rounded-xl transition-all duration-700"
                      style={{ height: `${Math.max(4, pct)}%`, backgroundColor: isPeak ? '#D49E4A' : '#120B0520', border: isPeak ? 'none' : '1px solid #120B0510' }}
                    />
                    <span className="text-[7px] font-black text-black/30 truncate w-full text-center">{m.monthName.slice(0,3)}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-black/30 mt-3 font-black uppercase">Peak: {efyReport.peakMonth.monthName} — {formatETB(efyReport.peakMonth.revenue)}</p>
          </div>
        </div>
      )}

      {/* ERCA Compliance Tab */}
      {activeTab === 'ERCA' && (
        <div className="glass p-10 rounded-[40px] shadow-2xl border-0.5 border-black/5 animate-fade-in-up space-y-8">
          <div className="flex items-center gap-3">
            <ShieldCheck size={24} className="text-[#D49E4A]" />
            <div>
              <h4 className="font-black text-lg text-[#120B05]">ERCA Compliance</h4>
              <p className="text-[9px] uppercase tracking-widest font-black text-black/30">የERC ሕጋዊ መስፈርቶች</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[['tin','TIN Number','e.g. 0012345678'],['vatNumber','VAT Registration','e.g. ETH-VAT-001234'],['fiscalDeviceId','Fiscal Device ID','e.g. FD-2024-00123']].map(([k,label,ph]) => (
              <div key={k} className="space-y-2">
                <label className="text-[10px] font-black uppercase text-black/40 ml-2">{label}</label>
                <input value={ercaForm[k]} onChange={e => setErcaForm(f => ({...f,[k]:e.target.value}))}
                  placeholder={ph}
                  className="w-full bg-white/50 border-0.5 border-black/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#D49E4A] transition-all" />
              </div>
            ))}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-black/40 ml-2">Taxpayer Category</label>
              <select value={ercaForm.taxpayerCategory} onChange={e => setErcaForm(f => ({...f,taxpayerCategory:e.target.value}))}
                className="w-full bg-white/50 border-0.5 border-black/5 rounded-2xl px-6 py-4 text-sm focus:outline-none transition-all">
                <option value="A">Category A (&lt;500K ETB/yr)</option>
                <option value="B">Category B (500K–1M ETB/yr)</option>
                <option value="C">Category C (&gt;1M ETB/yr)</option>
              </select>
            </div>
          </div>
          <button onClick={saveErca}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all ${
              ercaSaved ? 'bg-green-500 text-white' : 'bg-[#D49E4A] text-[#120B05] hover:bg-[#120B05] hover:text-white'
            }`}>
            <Save size={14} />{ercaSaved ? 'Saved ✓' : 'Save ERCA Settings'}
          </button>
        </div>
      )}

      {/* Floating Bottom Nav (Luxury Tabs) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-dark p-2 rounded-full shadow-2xl flex gap-1 border-0.5 border-white/20 overflow-x-auto max-w-[95vw]">
        {['Briefing', 'Revenue', 'EFY', 'Staff', 'Reports', 'Margins', 'ERCA', 'Settings'].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-3 rounded-full text-[8px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${
              activeTab === t ? 'bg-[#D49E4A] text-[#120B05]' : 'text-white/40 hover:text-white'
            }`}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OwnerView;
