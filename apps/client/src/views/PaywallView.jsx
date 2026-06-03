// apps/client/src/views/PaywallView.jsx
// Shown when the API returns 402 (trial expired or subscription cancelled).
// Premium, non-alarming design — encourages upgrade rather than panicking the user.
import React from 'react';
import { useStore } from '../store/useStore';
import { Clock, Zap, Crown, ArrowRight, Coffee, MessageCircle } from 'lucide-react';

const WA_LINK = `https://wa.me/251977717475?text=${encodeURIComponent('ሰላም! Jan Systems subscription ማደስ እፈልጋለሁ። Hello! I need to renew my Jan Systems subscription.')}`;
const TG_LINK = 'https://t.me/jan_web_dev';

const PLANS = [
  {
    name: 'Starter',
    price: '1,990',
    period: '/ወር',
    features: ['1 POS tablet', 'Cash & Telebirr', 'Amharic UI', '80mm receipt', 'Email support'],
    highlight: false,
    icon: Coffee,
  },
  {
    name: 'Pro',
    price: '3,490',
    period: '/ወር',
    features: ['2 POS + KDS', 'All payments', 'ERCA receipts', 'EFY reports', 'Inventory', 'WhatsApp support'],
    highlight: true,
    icon: Zap,
  },
  {
    name: 'Enterprise',
    price: 'ተነጋጋሪ',
    period: '',
    features: ['Unlimited venues', 'Custom integrations', 'Dedicated manager', 'SLA 4hr', 'On-site training'],
    highlight: false,
    icon: Crown,
  },
];

export default function PaywallView({ code, onLogout }) {
  const { config } = useStore();

  const isTrialExpired = code === 'TRIAL_EXPIRED';
  const title = isTrialExpired ? 'Your trial has ended.' : 'Subscription required.';
  const subtitle = isTrialExpired
    ? "You've been using Jan Systems for 30 days — upgrade now to keep your data and continue operations."
    : 'Your subscription is no longer active. Reactivate to access your venue dashboard.';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#120B05] flex flex-col items-center justify-center p-6 selection:bg-[#D49E4A] selection:text-white">

      {/* Status Badge */}
      <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full mb-8 animate-fade-in">
        <Clock size={14} className="text-amber-600" />
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">
          {isTrialExpired ? 'Trial Period Ended' : 'Subscription Inactive'}
        </span>
      </div>

      {/* Hero Text */}
      <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tightest text-center leading-tight mb-4 animate-fade-in-up">
        {title.split('.')[0]}
        <span className="text-[#D49E4A]">.</span>
      </h1>
      <p className="text-center text-black/50 max-w-lg mb-12 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {subtitle}
      </p>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl w-full mb-12">
        {PLANS.map((plan, i) => (
          <div
            key={plan.name}
            className={`p-7 rounded-[32px] flex flex-col transition-all duration-500 animate-fade-in-up ${
              plan.highlight
                ? 'bg-[#D49E4A] shadow-[0_20px_60px_rgba(212,158,74,0.3)] -translate-y-2'
                : 'bg-white border border-black/5 shadow-lg'
            }`}
            style={{ animationDelay: `${150 + i * 80}ms` }}
          >
            {plan.highlight && (
              <span className="text-[#120B05] text-[8px] font-black uppercase tracking-widest bg-white/30 px-3 py-1 rounded-full self-start mb-3">
                Recommended
              </span>
            )}

            <div className="flex items-center gap-2 mb-3">
              <plan.icon size={18} className={plan.highlight ? 'text-white' : 'text-[#D49E4A]'} />
              <h3 className={`text-xl font-black tracking-tight ${plan.highlight ? 'text-white' : 'text-[#120B05]'}`}>
                {plan.name}
              </h3>
            </div>

            <div className={`text-3xl font-serif font-black mb-1 ${plan.highlight ? 'text-white' : 'text-[#120B05]'}`}>
              {plan.price === 'ተነጋጋሪ' ? <span className="text-2xl">ተነጋጋሪ</span> : <>ETB {plan.price}</>}
            </div>
            {plan.period && (
              <p className={`text-sm mb-5 ${plan.highlight ? 'text-white/70' : 'text-black/40'}`}>{plan.period}</p>
            )}

            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map(f => (
                <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-white/90' : 'text-black/60'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${plan.highlight ? 'bg-white' : 'bg-[#D49E4A]'}`} />
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={plan.price === 'ተነጋጋሪ' ? TG_LINK : WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-3.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all hover:-translate-y-0.5 text-center flex items-center justify-center gap-2 ${
                plan.highlight
                  ? 'bg-white text-[#D49E4A] hover:bg-[#120B05] hover:text-white shadow-lg'
                  : plan.price === 'ተነጋጋሪ'
                    ? 'border border-black/15 text-black/60 hover:border-[#D49E4A] hover:text-[#D49E4A]'
                    : 'bg-[#120B05] text-white hover:bg-[#D49E4A]'
              }`}
            >
              {plan.price === 'ተነጋጋሪ' ? 'Contact Sales' : 'Upgrade Now'}
            </a>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center gap-6 flex-wrap justify-center">
        <button
          onClick={onLogout}
          className="text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-black/60 transition-all"
        >
          Sign Out
        </button>
        <span className="text-black/10">|</span>
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#25D366] hover:opacity-80 transition-all"
        >
          <MessageCircle size={12} />
          WhatsApp to Upgrade
        </a>
        <span className="text-black/10">|</span>
        <a href={TG_LINK} target="_blank" rel="noopener noreferrer"
          className="text-[10px] font-black uppercase tracking-widest text-[#D49E4A] hover:opacity-80 transition-all flex items-center gap-1"
        >
          Telegram: @jan_web_dev <ArrowRight size={10} />
        </a>
      </div>

      {/* Reassurance */}
      <p className="mt-8 text-[9px] text-black/20 font-black uppercase tracking-widest text-center max-w-md">
        Your data is safe. All orders, inventory, and reports are preserved — upgrade anytime to resume.
      </p>
    </div>
  );
}
