// apps/client/src/views/SuperadminPanel.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Users, TrendingUp, Plus, ShieldOff, ShieldCheck, Settings, ChevronRight, X, Wifi, Coffee } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const ETB = n => `ETB ${Number(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;

const PLAN_COLORS = { TRIAL: '#f59e0b', BASIC: '#3b82f6', PRO: '#D49E4A', ENTERPRISE: '#8b5cf6' };
const STATUS_COLORS = { ACTIVE: '#22c55e', TRIAL: '#f59e0b', SUSPENDED: '#ef4444', CANCELLED: '#6b7280' };

const EMPTY_VENUE = {
  venueName: '', venueNameAmharic: '', slug: '', plan: 'TRIAL',
  city: 'Addis Ababa', phone: '', tin: '',
  ownerName: '', ownerEmail: '', ownerPassword: '',
  config: { primaryColor: '#D49E4A', currency: 'ETB', enableTelebirr: true, enableCash: true, enableCbeBirr: true, enableEthiopay: false, enableBankTransfer: false, enableEfy: true }
};

export default function SuperadminPanel() {
  const [tab, setTab]           = useState('venues');
  const [venues, setVenues]     = useState([]);
  const [summary, setSummary]   = useState(null);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew]   = useState(false);
  const [form, setForm]         = useState(EMPTY_VENUE);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);

  const token   = localStorage.getItem('jan_token');
  const headers = { Authorization: `Bearer ${token}` };

  const load = async () => {
    try {
      const [vRes, sRes] = await Promise.all([
        axios.get(`${API}/api/superadmin/venues`, { headers }),
        axios.get(`${API}/api/superadmin/summary`, { headers }),
      ]);
      setVenues(vRes.data);
      setSummary(sRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    await axios.patch(`${API}/api/superadmin/venues/${id}/status`, { status }, { headers });
    load();
  };

  const setPlan = async (id, plan) => {
    await axios.patch(`${API}/api/superadmin/venues/${id}/plan`, { plan }, { headers });
    load();
  };

  const provisionVenue = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/superadmin/venues`, form, { headers });
      setResult(res.data);
      setShowNew(false);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Provisioning failed');
    } finally { setLoading(false); }
  };

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setCfg = (key, val) => setForm(f => ({ ...f, config: { ...f.config, [key]: val } }));

  return (
    <div className="space-y-10 animate-fade-in pb-32">

      {/* ── Header ── */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-serif font-black tracking-tightest text-[#120B05]">Jan Systems</h2>
          <p className="text-[11px] uppercase tracking-widest font-black text-[#D49E4A] mt-1">Superadmin Control Center</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_VENUE); setShowNew(true); setResult(null); }}
          className="flex items-center gap-2 px-6 py-3 bg-[#120B05] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#D49E4A] transition-all shadow-xl"
        >
          <Plus size={14} /> Onboard Cafe
        </button>
      </div>

      {/* ── KPI Summary ── */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Venues',  value: summary.venueCount,  icon: Building2,   color: '#D49E4A' },
            { label: 'Total Users',    value: summary.userCount,   icon: Users,       color: '#3b82f6' },
            { label: 'Total Orders',   value: summary.totalOrders, icon: Coffee,      color: '#22c55e' },
            { label: 'On Trial',       value: summary.trialCount,  icon: TrendingUp,  color: '#f59e0b' },
          ].map(k => (
            <div key={k.label} className="glass p-6 rounded-[28px] border border-black/5 shadow-lg">
              <k.icon size={18} style={{ color: k.color }} className="mb-3" />
              <div className="text-2xl font-serif font-black text-[#120B05]">{k.value}</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-black/30 mt-1">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Venue List ── */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-black/30">All Venues</h3>
        {venues.map(v => (
          <div key={v.id} className="glass rounded-[24px] p-6 border border-black/5 shadow-md">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                {/* Color swatch */}
                <div className="w-10 h-10 rounded-xl shadow-inner flex items-center justify-center font-black text-white text-sm"
                  style={{ backgroundColor: v.cafeConfig?.primaryColor || '#D49E4A' }}>
                  {v.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-[#120B05] tracking-tight">{v.name}</h4>
                  <p className="text-[9px] uppercase font-black tracking-widest text-black/30">
                    {v.slug} • {v.city} • {v._count.users} users
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Revenue */}
                <div className="text-right">
                  <div className="font-serif font-black text-[#120B05]">{ETB(v.totalRevenue)}</div>
                  <div className="text-[8px] uppercase font-black text-black/20">{v.orderCount} orders</div>
                </div>

                {/* Plan badge */}
                <select
                  value={v.plan}
                  onChange={e => setPlan(v.id, e.target.value)}
                  className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border-0 cursor-pointer"
                  style={{ backgroundColor: `${PLAN_COLORS[v.plan]}20`, color: PLAN_COLORS[v.plan] }}
                >
                  {['TRIAL','BASIC','PRO','ENTERPRISE'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                {/* Status badge */}
                <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: `${STATUS_COLORS[v.subscription] || '#6b7280'}15`, color: STATUS_COLORS[v.subscription] || '#6b7280' }}>
                  {v.subscription}
                </span>

                {/* Suspend / Activate */}
                {v.subscription === 'ACTIVE' || v.subscription === 'TRIAL' ? (
                  <button onClick={() => setStatus(v.id, 'SUSPENDED')}
                    className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Suspend">
                    <ShieldOff size={14} />
                  </button>
                ) : (
                  <button onClick={() => setStatus(v.id, 'ACTIVE')}
                    className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-500 hover:text-white transition-all" title="Activate">
                    <ShieldCheck size={14} />
                  </button>
                )}

                {/* Config */}
                <button onClick={() => setSelected(selected?.id === v.id ? null : v)}
                  className="p-2 bg-black/5 rounded-xl hover:bg-[#120B05] hover:text-white transition-all">
                  <Settings size={14} />
                </button>
              </div>
            </div>

            {/* Inline config editor */}
            {selected?.id === v.id && (
              <VenueConfigEditor venue={v} headers={headers} onSave={load} />
            )}
          </div>
        ))}
      </div>

      {/* ── Onboard New Venue Modal ── */}
      {showNew && (
        <div className="fixed inset-0 bg-[#120B05]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass w-full max-w-2xl my-8 p-8 rounded-[40px] shadow-2xl border border-white/10 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-serif font-black text-[#120B05]">Onboard New Cafe</h3>
                <p className="text-[9px] uppercase tracking-widest text-[#D49E4A] font-black mt-1">Create venue, config & owner in one step</p>
              </div>
              <button onClick={() => setShowNew(false)} className="text-black/20 hover:text-[#120B05]"><X size={22} /></button>
            </div>

            <form onSubmit={provisionVenue} className="space-y-6">
              {/* Venue Identity */}
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-black/30">Venue Identity</p>
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Cafe Name (English)" value={form.venueName}
                    onChange={e => setF('venueName', e.target.value)}
                    className="bg-black/5 border border-black/5 rounded-2xl px-4 py-3 text-sm font-medium" />
                  <input placeholder="የካፌ ስም (Amharic)" value={form.venueNameAmharic}
                    onChange={e => setF('venueNameAmharic', e.target.value)}
                    className="bg-black/5 border border-black/5 rounded-2xl px-4 py-3 text-sm font-medium" />
                  <input required placeholder="slug (e.g. buna-and-co)" value={form.slug}
                    onChange={e => setF('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="bg-black/5 border border-black/5 rounded-2xl px-4 py-3 text-sm font-mono" />
                  <input placeholder="City" value={form.city}
                    onChange={e => setF('city', e.target.value)}
                    className="bg-black/5 border border-black/5 rounded-2xl px-4 py-3 text-sm" />
                  <input placeholder="Phone" value={form.phone}
                    onChange={e => setF('phone', e.target.value)}
                    className="bg-black/5 border border-black/5 rounded-2xl px-4 py-3 text-sm" />
                  <input placeholder="TIN (optional)" value={form.tin}
                    onChange={e => setF('tin', e.target.value)}
                    className="bg-black/5 border border-black/5 rounded-2xl px-4 py-3 text-sm" />
                </div>
              </div>

              {/* Owner Account */}
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-black/30">Owner Account</p>
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Owner Full Name" value={form.ownerName}
                    onChange={e => setF('ownerName', e.target.value)}
                    className="bg-black/5 border border-black/5 rounded-2xl px-4 py-3 text-sm" />
                  <input required type="email" placeholder="Owner Email" value={form.ownerEmail}
                    onChange={e => setF('ownerEmail', e.target.value)}
                    className="bg-black/5 border border-black/5 rounded-2xl px-4 py-3 text-sm" />
                  <input type="password" placeholder="Password (auto-generated if blank)" value={form.ownerPassword}
                    onChange={e => setF('ownerPassword', e.target.value)}
                    className="bg-black/5 border border-black/5 rounded-2xl px-4 py-3 text-sm col-span-2" />
                </div>
              </div>

              {/* Plan & Branding */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-black/30">Plan</p>
                  <select value={form.plan} onChange={e => setF('plan', e.target.value)}
                    className="w-full bg-black/5 border border-black/5 rounded-2xl px-4 py-3 text-sm font-bold">
                    {['TRIAL','BASIC','PRO','ENTERPRISE'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-black/30">Brand Color</p>
                  <input type="color" value={form.config.primaryColor}
                    onChange={e => setCfg('primaryColor', e.target.value)}
                    className="w-full h-[50px] bg-black/5 border border-black/5 rounded-2xl px-2 py-1 cursor-pointer" />
                </div>
              </div>

              {/* Payment Toggles */}
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-black/30">Payment Methods</p>
                <div className="flex flex-wrap gap-2">
                  {[['enableCash','Cash'],['enableTelebirr','Telebirr'],['enableCbeBirr','CBE Birr'],['enableEthiopay','EthioPay'],['enableBankTransfer','Bank Transfer']].map(([k, label]) => (
                    <button key={k} type="button"
                      onClick={() => setCfg(k, !form.config[k])}
                      className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${form.config[k] ? 'bg-[#120B05] text-white border-[#120B05]' : 'bg-black/5 text-black/30 border-black/10'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-[#D49E4A] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-[#120B05] transition-all disabled:opacity-50">
                {loading ? 'Provisioning...' : '✓ Provision Venue & Create Owner'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Provisioning Success Modal ── */}
      {result && (
        <div className="fixed inset-0 bg-[#120B05]/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass w-full max-w-md p-8 rounded-[40px] shadow-2xl border border-white/10 space-y-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-2xl mx-auto flex items-center justify-center">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-serif font-black text-[#120B05]">{result.venue.name}</h3>
              <p className="text-[9px] uppercase tracking-widest text-green-600 font-black mt-1">Venue Provisioned Successfully</p>
            </div>
            <div className="bg-black/5 rounded-2xl p-5 text-left space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-3">Owner Credentials</p>
              <p className="font-mono text-sm"><span className="text-black/30">Email: </span>{result.credentials.email}</p>
              {result.autoGeneratedPw && (
                <p className="font-mono text-sm"><span className="text-black/30">Password: </span><strong>{result.credentials.password}</strong></p>
              )}
              <p className="font-mono text-sm"><span className="text-black/30">Venue ID: </span>{result.venue.id}</p>
              {result.trialExpiresAt && (
                <p className="font-mono text-sm"><span className="text-black/30">Trial Ends: </span>{new Date(result.trialExpiresAt).toLocaleDateString()}</p>
              )}
            </div>
            {result.autoGeneratedPw && (
              <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest bg-amber-50 px-4 py-2 rounded-xl">
                ⚠ Share credentials securely — not shown again
              </p>
            )}
            <button onClick={() => setResult(null)}
              className="w-full py-3 bg-[#120B05] text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline Venue Config Editor ────────────────────────────────────────────────
function VenueConfigEditor({ venue, headers, onSave }) {
  const [cfg, setCfg] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/superadmin/venues/${venue.id}/config`, { headers })
      .then(r => setCfg(r.data)).catch(() => {});
  }, [venue.id]);

  const save = async () => {
    await axios.patch(`${API}/api/superadmin/venues/${venue.id}/config`, cfg, { headers });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSave();
  };

  if (!cfg) return <div className="mt-4 text-center text-black/20 text-sm animate-pulse">Loading config…</div>;

  const toggle = (key) => setCfg(c => ({ ...c, [key]: !c[key] }));

  return (
    <div className="mt-6 pt-6 border-t border-black/5 space-y-5 animate-fade-in">
      <p className="text-[9px] font-black uppercase tracking-widest text-black/30">White-Label Config — {venue.name}</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[['cafeName','Cafe Name (EN)'],['cafeNameAmharic','Cafe Name (AM)'],['receiptHeader','Receipt Header'],['receiptFooter','Receipt Footer'],['tin','TIN'],['vatNumber','VAT Number']].map(([k, label]) => (
          <div key={k} className="space-y-1">
            <label className="text-[8px] font-black uppercase text-black/30">{label}</label>
            <input value={cfg[k] || ''} onChange={e => setCfg(c => ({ ...c, [k]: e.target.value }))}
              className="w-full bg-black/5 border border-black/5 rounded-xl px-3 py-2 text-sm" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[8px] font-black uppercase text-black/30">Brand Color</label>
          <input type="color" value={cfg.primaryColor || '#D49E4A'} onChange={e => setCfg(c => ({ ...c, primaryColor: e.target.value }))}
            className="w-full h-10 bg-black/5 border border-black/5 rounded-xl px-1 cursor-pointer" />
        </div>
        <div className="space-y-1">
          <label className="text-[8px] font-black uppercase text-black/30">Receipt Lang</label>
          <select value={cfg.receiptLanguage || 'BOTH'} onChange={e => setCfg(c => ({ ...c, receiptLanguage: e.target.value }))}
            className="w-full bg-black/5 border border-black/5 rounded-xl px-3 py-2 text-sm">
            <option value="EN">English Only</option>
            <option value="AM">Amharic Only</option>
            <option value="BOTH">Bilingual (EN + AM)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[['enableCash','Cash'],['enableTelebirr','Telebirr'],['enableCbeBirr','CBE Birr'],['enableEthiopay','EthioPay'],['enableBankTransfer','Bank Transfer'],['enableEfy','EFY Mode']].map(([k, label]) => (
          <button key={k} type="button" onClick={() => toggle(k)}
            className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${cfg[k] ? 'bg-[#120B05] text-white border-[#120B05]' : 'bg-black/5 text-black/30 border-black/10'}`}>
            {label} {cfg[k] ? '✓' : '○'}
          </button>
        ))}
      </div>

      <button onClick={save}
        className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${saved ? 'bg-green-500 text-white' : 'bg-[#D49E4A] text-white hover:bg-[#120B05]'}`}>
        {saved ? '✓ Saved' : 'Save Config'}
      </button>
    </div>
  );
}
