// apps/client/src/views/SetupWizard.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Coffee, Palette, CreditCard, Receipt, UserPlus, ShieldCheck, Rocket, X } from 'lucide-react';

const SetupWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 8; // Added ERCA step
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    config: {
      cafeName: 'Jan Systems Cafe',
      cafeNameAmharic: 'ጃን ሲስተምስ ካዾ',
      primaryColor: '#120B05',
      currency: 'ETB',
      currencySymbol: 'ብር',
      enableCash:         true,
      enableTelebirr:     true,
      enableCbeBirr:      true,
      enableEthiopay:     false,
      enableBankTransfer: false,
      enableEfy:          true,
      defaultLanguage:    'EN',
      receiptHeader: 'Welcome to Jan Systems',
      receiptFooter: 'Thank you for your visit!',
      tin:              '',
      vatNumber:        '',
      fiscalDeviceId:   '',
      taxpayerCategory: 'B',
    },
    owner: { name: '', email: '', password: '' },
    admin: { name: '', email: '', password: '' }
  });

  const [loadDemo, setLoadDemo] = useState(false);
  const [error, setError] = useState(null);

  const handleInit = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/setup/init`, formData);
      if (loadDemo) {
        // Find the installer token (needed for SUPERADMIN auth)
        const token = localStorage.getItem('jan_token'); 
        await axios.post(`${import.meta.env.VITE_API_URL}/api/setup/seed-demo`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      onComplete();
    } catch (err) {
      setError(err.response?.data?.error || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      {/* ── PROGRESS BAR ── */}
      <div className="flex justify-between items-center px-4 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-black/5 -translate-y-1/2 z-0"></div>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
          <div 
            key={s}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs z-10 transition-all duration-700 ${
              step >= s ? 'bg-[#120B05] text-white shadow-xl' : 'bg-white text-black/20 border-0.5 border-black/5'
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      <div className="glass p-12 rounded-[50px] shadow-2xl border-0.5 border-black/5 space-y-10 animate-fade-in-up">
        {error && (
          <div className="bg-red-50 border-0.5 border-red-200 p-6 rounded-3xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-4 text-red-600">
              <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center font-black">!</div>
              <p className="text-xs font-black uppercase tracking-widest">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-red-600">
              <X size={18} />
            </button>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-8 text-center py-10">
            <div className="w-24 h-24 bg-[#120B05] rounded-[30px] flex items-center justify-center text-white mx-auto shadow-2xl">
              <ShieldCheck size={48} />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-serif font-black tracking-tightest">Jan Systems Installer</h2>
              <p className="text-sm text-black/40 max-w-md mx-auto">This wizard will configure the cafe environment for first-time use. Please proceed with the Jan Systems security key.</p>
            </div>
            <button onClick={nextStep} className="px-12 py-5 bg-[#120B05] text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-[#D49E4A] transition-all">Begin Installation</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4 text-[#D49E4A]">
              <Coffee size={32} />
              <h3 className="text-2xl font-serif font-black">Cafe Identity</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-black/40 ml-2">Cafe Name (English)</label>
                <input 
                  type="text" className="w-full bg-black/5 border-0.5 border-black/5 rounded-2xl px-6 py-4"
                  value={formData.config.cafeName} onChange={e => setFormData({...formData, config: {...formData.config, cafeName: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-black/40 ml-2">የካፌ ስም (Amharic)</label>
                <input 
                  type="text" className="w-full bg-black/5 border-0.5 border-black/5 rounded-2xl px-6 py-4"
                  value={formData.config.cafeNameAmharic} onChange={e => setFormData({...formData, config: {...formData.config, cafeNameAmharic: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-black/40 ml-2">Primary Brand Color</label>
                <input 
                  type="color" className="w-full h-14 bg-black/5 border-0.5 border-black/5 rounded-2xl px-2 py-2"
                  value={formData.config.primaryColor} onChange={e => setFormData({...formData, config: {...formData.config, primaryColor: e.target.value}})}
                />
              </div>
            </div>
            <div className="flex justify-between pt-10">
              <button onClick={prevStep} className="text-xs font-black uppercase text-black/20">Back</button>
              <button onClick={nextStep} className="px-10 py-4 bg-[#120B05] text-white rounded-2xl font-black uppercase text-xs">Next: Payments</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4 text-[#D49E4A]">
              <CreditCard size={32} />
              <h3 className="text-2xl font-serif font-black">Payment Methods</h3>
            </div>
            <p className="text-[10px] text-black/40 font-black uppercase tracking-widest -mt-4">
              Enable the payment methods active at this venue. You can change these later in Admin → Settings.
            </p>
            <div className="space-y-3">
              {[
                { label: 'Cash Payments — ጥሬ ገንዘብ',              key: 'enableCash',         required: true },
                { label: 'Telebirr Integration — ቴሌብር',              key: 'enableTelebirr',     required: false },
                { label: 'CBE Birr Integration — CBE ብር',              key: 'enableCbeBirr',      required: false },
                { label: 'EthioPay (Interoperable Gateway) — ኢትዮፔይ', key: 'enableEthiopay',     required: false },
                { label: 'Bank Transfer — ባንክ ዝውውር',                  key: 'enableBankTransfer', required: false },
              ].map(m => (
                <div key={m.key} className="flex justify-between items-center p-5 bg-black/5 rounded-3xl">
                  <div>
                    <span className="font-bold text-sm">{m.label}</span>
                    {m.required && <span className="ml-2 text-[9px] text-amber-500 font-black uppercase">Required</span>}
                  </div>
                  <input
                    type="checkbox" className="w-6 h-6"
                    checked={formData.config[m.key]}
                    disabled={m.required}
                    onChange={e => setFormData({...formData, config: {...formData.config, [m.key]: e.target.checked}})}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-10">
              <button onClick={prevStep} className="text-xs font-black uppercase text-black/20">Back</button>
              <button onClick={nextStep} className="px-10 py-4 bg-[#120B05] text-white rounded-2xl font-black uppercase text-xs">Next: ERCA Setup</button>
            </div>
          </div>
        )}

        {/* ── STEP 4: ERCA Compliance ── */}
        {step === 4 && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4 text-[#D49E4A]">
              <ShieldCheck size={32} />
              <div>
                <h3 className="text-2xl font-serif font-black">ERCA Compliance</h3>
                <p className="text-[10px] text-black/40 font-black uppercase tracking-widest mt-1">
                  Ethiopian Revenue and Customs Authority — Required for VAT receipts
                </p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-sm text-amber-700 font-bold">
              ⚠️ These fields can be left blank during setup and filled later from Admin → Settings.
              TIN and Fiscal Device ID are required for ERCA-compliant printed receipts.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-black/40 ml-2">Business TIN</label>
                <input
                  type="text" placeholder="e.g. 0012345678"
                  className="w-full bg-black/5 border-0.5 border-black/5 rounded-2xl px-6 py-4 font-bold"
                  value={formData.config.tin}
                  onChange={e => setFormData({...formData, config: {...formData.config, tin: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-black/40 ml-2">VAT Registration Number</label>
                <input
                  type="text" placeholder="e.g. VAT-ET-00012"
                  className="w-full bg-black/5 border-0.5 border-black/5 rounded-2xl px-6 py-4 font-bold"
                  value={formData.config.vatNumber}
                  onChange={e => setFormData({...formData, config: {...formData.config, vatNumber: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-black/40 ml-2">ERCA Fiscal Device ID</label>
                <input
                  type="text" placeholder="e.g. FD-ET-2024-XXXX"
                  className="w-full bg-black/5 border-0.5 border-black/5 rounded-2xl px-6 py-4 font-bold"
                  value={formData.config.fiscalDeviceId}
                  onChange={e => setFormData({...formData, config: {...formData.config, fiscalDeviceId: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-black/40 ml-2">Taxpayer Category (ERCA)</label>
                <select
                  className="w-full bg-black/5 border-0.5 border-black/5 rounded-2xl px-6 py-4 font-bold"
                  value={formData.config.taxpayerCategory}
                  onChange={e => setFormData({...formData, config: {...formData.config, taxpayerCategory: e.target.value}})}
                >
                  <option value="B">Category B (Annual turnover 500K–1M ETB)</option>
                  <option value="C">Category C (Annual turnover &gt;1M ETB)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-between pt-10">
              <button onClick={prevStep} className="text-xs font-black uppercase text-black/20">Back</button>
              <button onClick={nextStep} className="px-10 py-4 bg-[#120B05] text-white rounded-2xl font-black uppercase text-xs">Next: Receipts</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4 text-[#D49E4A]">
              <Receipt size={32} />
              <h3 className="text-2xl font-serif font-black">Receipt Configuration</h3>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-black/40 ml-2">Receipt Header</label>
                <input 
                  type="text" className="w-full bg-black/5 border-0.5 border-black/5 rounded-2xl px-6 py-4"
                  value={formData.config.receiptHeader} onChange={e => setFormData({...formData, config: {...formData.config, receiptHeader: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-black/40 ml-2">Receipt Footer</label>
                <input 
                  type="text" className="w-full bg-black/5 border-0.5 border-black/5 rounded-2xl px-6 py-4"
                  value={formData.config.receiptFooter} onChange={e => setFormData({...formData, config: {...formData.config, receiptFooter: e.target.value}})}
                />
              </div>
            </div>
            <div className="flex justify-between pt-10">
              <button onClick={prevStep} className="text-xs font-black uppercase text-black/20">Back</button>
              <button onClick={nextStep} className="px-10 py-4 bg-[#120B05] text-white rounded-2xl font-black uppercase text-xs">Next: Owner Account</button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4 text-[#D49E4A]">
              <UserPlus size={32} />
              <h3 className="text-2xl font-serif font-black">Create Owner Account</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input 
                placeholder="Full Name" className="w-full bg-black/5 border-0.5 border-black/5 rounded-2xl px-6 py-4"
                value={formData.owner.name} onChange={e => setFormData({...formData, owner: {...formData.owner, name: e.target.value}})}
              />
              <input 
                placeholder="Email Address" className="w-full bg-black/5 border-0.5 border-black/5 rounded-2xl px-6 py-4"
                value={formData.owner.email} onChange={e => setFormData({...formData, owner: {...formData.owner, email: e.target.value}})}
              />
              <input 
                type="password" placeholder="Password" className="w-full bg-black/5 border-0.5 border-black/5 rounded-2xl px-6 py-4 md:col-span-2"
                value={formData.owner.password} onChange={e => setFormData({...formData, owner: {...formData.owner, password: e.target.value}})}
              />
            </div>
            <div className="flex justify-between pt-10">
              <button onClick={prevStep} className="text-xs font-black uppercase text-black/20">Back</button>
              <button onClick={nextStep} className="px-10 py-4 bg-[#120B05] text-white rounded-2xl font-black uppercase text-xs">Next: Admin Account</button>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4 text-[#D49E4A]">
              <ShieldCheck size={32} />
              <h3 className="text-2xl font-serif font-black">Create Initial Admin</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input 
                placeholder="Full Name" className="w-full bg-black/5 border-0.5 border-black/5 rounded-2xl px-6 py-4"
                value={formData.admin.name} onChange={e => setFormData({...formData, admin: {...formData.admin, name: e.target.value}})}
              />
              <input 
                placeholder="Email Address" className="w-full bg-black/5 border-0.5 border-black/5 rounded-2xl px-6 py-4"
                value={formData.admin.email} onChange={e => setFormData({...formData, admin: {...formData.admin, email: e.target.value}})}
              />
              <input 
                type="password" placeholder="Password" className="w-full bg-black/5 border-0.5 border-black/5 rounded-2xl px-6 py-4 md:col-span-2"
                value={formData.admin.password} onChange={e => setFormData({...formData, admin: {...formData.admin, password: e.target.value}})}
              />
            </div>
            <div className="flex justify-between pt-10">
              <button onClick={prevStep} className="text-xs font-black uppercase text-black/20">Back</button>
              <button onClick={nextStep} className="px-10 py-4 bg-[#120B05] text-white rounded-2xl font-black uppercase text-xs">Final: Confirmation</button>
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-8 animate-fade-in text-center py-6">
            <Rocket size={64} className="mx-auto text-[#D49E4A] animate-steam" />
            <div className="space-y-4">
              <h2 className="text-4xl font-serif font-black">Ready for Launch</h2>
              <p className="text-sm text-black/40">Review all settings above. Clicking "Launch System" will finalize the installation and enable the cafe environment.</p>
            </div>
            <div className="bg-black/5 p-8 rounded-[40px] text-left space-y-4">
              <div className="flex justify-between"><span className="opacity-40">Cafe:</span> <span className="font-black">{formData.config.cafeName}</span></div>
              <div className="flex justify-between"><span className="opacity-40">Owner:</span> <span className="font-black">{formData.owner.email}</span></div>
              <div className="flex justify-between"><span className="opacity-40">Admin:</span> <span className="font-black">{formData.admin.email}</span></div>
            </div>

            <div className="bg-amber-500/5 border-0.5 border-amber-500/20 p-6 rounded-3xl text-left flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-amber-700">Load Demo Environment</p>
                <p className="text-[10px] text-amber-600/60 uppercase font-black">Populates menu, ingredients, and tables with a sample Ethiopian cafe setup</p>
              </div>
              <input 
                type="checkbox" className="w-8 h-8 accent-amber-600 cursor-pointer"
                checked={loadDemo} onChange={e => setLoadDemo(e.target.checked)}
              />
            </div>

            <div className="flex justify-between pt-10">
              <button onClick={prevStep} className="text-xs font-black uppercase text-black/20">Back</button>
              <button 
                onClick={handleInit}
                disabled={loading}
                className="px-12 py-6 bg-[#120B05] text-white rounded-[30px] font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-green-500 transition-all flex items-center gap-4 mx-auto"
              >
                {loading ? 'Initializing System...' : 'Launch System'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupWizard;
