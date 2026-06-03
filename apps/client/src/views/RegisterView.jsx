// apps/client/src/views/RegisterView.jsx
// Self-service venue registration with auto-login.
// After successful registration, the user is immediately logged in and redirected to the Admin dashboard.
import React, { useState } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { storeLogin } from '../lib/venueResolver';
import { Coffee, ArrowLeft, Loader2, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const WA_LINK = `https://wa.me/251977717475?text=${encodeURIComponent('ሰላም! Jan Systems 30-day free trial ልጀምር እፈልጋለሁ። Hello! I want to start my free trial.')}`;

const CITIES = [
  'Addis Ababa — አዲስ አበባ',
  'Hawassa — ሀዋሳ',
  'Dire Dawa — ድሬ ዳዋ',
  'Bahir Dar — ባህር ዳር',
  'Mekelle — መቀሌ',
  'Adama — አዳማ',
  'Jimma — ጅማ',
  'Dessie — ደሴ',
  'Gondar — ጎንደር',
  'Other — ሌላ',
];

const SOURCES = [
  'WhatsApp / Telegram',
  'Instagram / TikTok',
  'Word of mouth (ከጓደኛ)',
  'Google search',
  'Other',
];

const RegisterView = () => {
  const { setView } = useStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    venueName: '',
    venueSlug: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
    city: 'Addis Ababa — አዲስ አበባ',
    hearAboutUs: '',
    plan: 'TRIAL',
  });

  const generateSlug = (name) =>
    name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

  const handleVenueNameChange = (e) => {
    const name = e.target.value;
    setFormData({ ...formData, venueName: name, venueSlug: generateSlug(name) });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API}/api/auth/register-saas`, formData);
      storeLogin({
        token: res.data.token,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
        venue: res.data.venue,
      });
      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
        return;
      }
      setView('admin');
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full bg-black/5 border-0 rounded-2xl px-6 py-4 font-medium focus:ring-2 focus:ring-[#D49E4A] transition-all outline-none';
  const labelClass = 'block text-[10px] font-black uppercase tracking-widest mb-2 opacity-40';

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
      <div className="max-w-xl w-full glass p-10 rounded-[50px] shadow-2xl border border-black/5 animate-fade-in-up">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="Jan Systems" className="h-8 w-auto" />
          </div>
          <h2 className="text-4xl font-serif font-black tracking-tight leading-none mb-4">
            Start Your <span className="text-[#D49E4A]">Free Trial.</span>
          </h2>
          <p className="text-sm font-medium opacity-40 uppercase tracking-widest">
            Step {step} of 2 • {step === 1 ? 'Venue Details' : 'Your Account'}
          </p>

          {/* Progress bar */}
          <div className="mt-4 h-1 bg-black/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D49E4A] rounded-full transition-all duration-500"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 text-red-600 px-5 py-4 rounded-2xl animate-fade-in">
            <AlertCircle size={16} />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-5 animate-fade-in-right">
              <div>
                <label className={labelClass}>Cafe Name — የካፌ ስም</label>
                <input
                  type="text"
                  value={formData.venueName}
                  onChange={handleVenueNameChange}
                  className={inputClass}
                  placeholder="e.g. Kaldi's Coffee"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>URL Slug</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.venueSlug}
                    onChange={(e) => {
                      setFormData({ ...formData, venueSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') });
                      setError(null);
                    }}
                    className={inputClass + ' font-mono text-sm'}
                    placeholder="kaldis-coffee"
                    required
                  />
                </div>
                <p className="text-[9px] text-black/30 mt-2 ml-2 font-bold">
                  {formData.venueSlug ? `Your venue: /venue/${formData.venueSlug}` : 'Choose a unique ID for your cafe'}
                </p>
              </div>

              <div>
                <label className={labelClass}>City — ከተማ</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={inputClass}
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>How did you hear about us? (Optional)</label>
                <select
                  value={formData.hearAboutUs}
                  onChange={(e) => setFormData({ ...formData, hearAboutUs: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select...</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Plan Selection */}
              <div>
                <label className={labelClass}>Plan</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'TRIAL', label: 'Free Trial', sub: '30 days' },
                    { id: 'BASIC', label: 'Starter', sub: 'ETB 1,990/mo' },
                    { id: 'PRO', label: 'Pro', sub: 'ETB 3,490/mo' },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, plan: p.id })}
                      className={`py-4 px-3 rounded-2xl text-center transition-all ${
                        formData.plan === p.id
                          ? 'bg-[#120B05] text-white shadow-xl'
                          : 'bg-black/5 opacity-50 hover:opacity-100'
                      }`}
                    >
                      <span className="block text-[10px] font-black tracking-widest">{p.label}</span>
                      <span className="block text-[8px] mt-1 opacity-60">{p.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.venueName || !formData.venueSlug}
                className="w-full bg-[#120B05] text-white py-5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-20"
              >
                Next: Your Account →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in-right">
              <div>
                <label className={labelClass}>Your Full Name</label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => { setFormData({ ...formData, ownerName: e.target.value }); setError(null); }}
                  className={inputClass}
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Phone Number — ስልክ (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputClass}
                  placeholder="+251 9XX XXX XXX"
                />
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setError(null); }}
                  className={inputClass}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setError(null); }}
                  className={inputClass}
                  placeholder="Min. 6 characters"
                  minLength={6}
                  required
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-black/5 py-5 rounded-full text-xs font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={12} /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-[#D49E4A] text-white py-5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 size={14} className="animate-spin" /> Creating Venue...</>
                  ) : (
                    <><CheckCircle2 size={14} /> Start Free Trial</>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Prefer to talk? */}
        <div className="mt-8 pt-6 border-t border-black/5 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-3">Prefer to talk first?</p>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#25D366] hover:opacity-80 transition-all"
          >
            <MessageCircle size={12} />
            WhatsApp us — ዋትስአፕ ያግኙን
          </a>
        </div>

        <button
          onClick={() => setView('landing')}
          className="mt-4 w-full text-[10px] font-black uppercase tracking-widest opacity-20 hover:opacity-60 transition-all"
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
};

export default RegisterView;
