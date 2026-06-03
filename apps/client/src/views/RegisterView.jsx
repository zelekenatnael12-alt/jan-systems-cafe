// apps/client/src/views/RegisterView.jsx
// Self-service venue registration with auto-login.
// After successful registration, the user is immediately logged in and redirected to the Admin dashboard.
import React, { useState } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { storeLogin } from '../lib/venueResolver';
import { Coffee, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

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
    plan: 'TRIAL'
  });

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  };

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

      // Auto-login: store token + user + venue info
      storeLogin({
        token: res.data.token,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
        venue: res.data.venue,
      });

      // If Stripe checkout is needed (paid plan), redirect
      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
        return;
      }

      // Otherwise, go straight to admin dashboard
      setView('admin');
      window.location.reload(); // Force re-init with new venue context
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
      <div className="max-w-xl w-full glass p-12 rounded-[50px] shadow-2xl border-0.5 border-black/5 animate-fade-in-up">

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Coffee size={20} className="text-[#D49E4A]" />
            <span className="font-serif font-black text-lg tracking-tight">Jan Systems</span>
          </div>
          <h2 className="text-4xl font-serif font-black tracking-tightest leading-none mb-4">
            Start Your <span className="text-[#D49E4A]">Legacy.</span>
          </h2>
          <p className="text-sm font-medium opacity-50 uppercase tracking-widest">
            Step {step} of 2 • {step === 1 ? 'Venue Details' : 'Owner Account'}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 text-red-600 px-5 py-4 rounded-2xl animate-fade-in">
            <AlertCircle size={16} />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in-right">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">Cafe Name</label>
                <input
                  type="text"
                  value={formData.venueName}
                  onChange={handleVenueNameChange}
                  className="w-full bg-black/5 border-0 rounded-2xl px-6 py-4 font-medium focus:ring-2 focus:ring-[#D49E4A] transition-all"
                  placeholder="e.g. Kaldi's Coffee"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">
                  URL Slug (your-cafe.jansystems.cafe)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.venueSlug}
                    onChange={(e) => { setFormData({...formData, venueSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')}); setError(null); }}
                    className="flex-1 bg-black/5 border-0 rounded-2xl px-6 py-4 font-mono text-sm focus:ring-2 focus:ring-[#D49E4A] transition-all"
                    placeholder="kaldis-coffee"
                    required
                  />
                </div>
                <p className="text-[9px] text-black/30 mt-2 ml-2 font-bold">
                  {formData.venueSlug ? `jansystems.cafe/venue/${formData.venueSlug}` : 'Choose a unique URL for your venue'}
                </p>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-3 opacity-40">Plan</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'TRIAL', label: 'Free Trial', sub: '30 days' },
                    { id: 'BASIC', label: 'Starter', sub: 'ETB 1,990/mo' },
                    { id: 'PRO', label: 'Pro', sub: 'ETB 3,490/mo' },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormData({...formData, plan: p.id})}
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
                Next: Account Setup
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in-right">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">Your Name</label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => { setFormData({...formData, ownerName: e.target.value}); setError(null); }}
                  className="w-full bg-black/5 border-0 rounded-2xl px-6 py-4 font-medium focus:ring-2 focus:ring-[#D49E4A] transition-all"
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => { setFormData({...formData, email: e.target.value}); setError(null); }}
                  className="w-full bg-black/5 border-0 rounded-2xl px-6 py-4 font-medium focus:ring-2 focus:ring-[#D49E4A] transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => { setFormData({...formData, password: e.target.value}); setError(null); }}
                  className="w-full bg-black/5 border-0 rounded-2xl px-6 py-4 font-medium focus:ring-2 focus:ring-[#D49E4A] transition-all"
                  placeholder="Min. 6 characters"
                  minLength={6}
                  required
                />
              </div>

              <div className="flex gap-4">
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
                    <><CheckCircle2 size={14} /> Complete Registration</>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <button
          onClick={() => setView('landing')}
          className="mt-8 w-full text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default RegisterView;
