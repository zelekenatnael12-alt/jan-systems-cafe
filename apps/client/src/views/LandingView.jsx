// apps/client/src/views/LandingView.jsx
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Wifi, WifiOff, Smartphone, Printer, Globe, ShieldCheck, BarChart3, Coffee, ChevronRight, Check } from 'lucide-react';

const FEATURES = [
  { icon: Wifi,         title: 'Offline-First',          am: 'ያለ ኢንተርኔት ይሠራል',   desc: 'Orders queue locally during Ethio Telecom outages. Auto-syncs when connection returns.' },
  { icon: Smartphone,   title: 'Telebirr & CBE Birr',    am: 'ቴሌብርና CBE ብር',       desc: 'QR-code payment with automatic confirmation. No manual code entry for cashiers.' },
  { icon: ShieldCheck,  title: 'ERCA Compliant',          am: 'የEFY ሪፖርት',           desc: 'TIN, VAT, fiscal device ID on every receipt. EFY monthly reports in Ge\'ez months.' },
  { icon: Globe,        title: 'Full Amharic UI',         am: 'አማርኛ ይደግፋል',         desc: 'One-tap language toggle. All menus, receipts, and KDS in Amharic or English.' },
  { icon: Printer,      title: '80mm Thermal Receipt',   am: 'የሙቀት ደረሰኝ',          desc: 'ESC/POS formatted, ERCA-standard header, dual date (Gregorian + EFY).' },
  { icon: BarChart3,    title: 'EFY Revenue Reports',    am: 'ዓ.ም ሪፖርት',            desc: 'Monthly bar charts in Ethiopian calendar. Owner dashboard in ETB.' },
];

const PLANS = [
  { name: 'Starter',    price: '1,990',  period: '/ወር',  en: '/mo', features: ['1 POS tablet','Cash & Telebirr','Amharic UI','80mm receipt','Email support'], highlight: false },
  { name: 'Pro',        price: '3,490',  period: '/ወር',  en: '/mo', features: ['2 POS + KDS screen','All payment methods','ERCA receipts','EFY reports','Inventory tracking','WhatsApp support'], highlight: true },
  { name: 'Enterprise', price: 'ተነጋጋሪ', period: '',     en: '',    features: ['Unlimited venues','Custom integrations','Dedicated manager','SLA 4hr response','On-site training'], highlight: false },
];

const TESTIMONIALS = [
  { name: 'Selam T.', role: 'Owner — Buna & Co., Bole', text: 'ከጀመርን ጀምሮ ዕለታዊ ሽያጭ 28% ጨምሯል። ቴሌብር ፍጹም ይሰራል። (Sales up 28% since launch. Telebirr works perfectly.)' },
  { name: 'Dawit M.', role: 'Manager — Kaldi\'s, Sarbet', text: 'The offline mode saved us during the fiber outage last month. Not a single lost order.' },
  { name: 'Hanan A.', role: 'Owner — Tomoca, Piazza',  text: 'EFY reports make our accountant\'s job so much easier. We never have to convert dates manually.' },
];

export default function LandingView() {
  const { setView } = useStore();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#120B05] font-sans selection:bg-[#D49E4A] selection:text-white overflow-x-hidden">

      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 backdrop-blur-xl bg-[#FAF9F6]/80 border-b border-black/5">
        <div className="flex items-center gap-2">
          <Coffee size={20} className="text-[#D49E4A]" />
          <span className="font-serif font-black text-xl tracking-tight">Jan Systems</span>
          <span className="text-[8px] font-black uppercase tracking-widest text-[#D49E4A] bg-[#D49E4A]/10 px-2 py-0.5 rounded-full ml-1">Ethiopia</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setView('owner')}
            className="text-[11px] font-black tracking-widest uppercase opacity-50 hover:opacity-100 transition-all">
            ግባ / Sign In
          </button>
          <button onClick={() => {
              localStorage.setItem('jan_venue_slug', 'demo-cafe');
              setView('customer');
            }}
            className="bg-[#120B05] text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg hover:-translate-y-0.5 transition-all">
            ሞክር / Try Demo
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-40 pb-24 px-6 max-w-6xl mx-auto text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 bg-[#D49E4A]/10 border border-[#D49E4A]/20 px-4 py-2 rounded-full mb-8">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#D49E4A]">Built for Ethiopian Cafes — ለኢትዮጵያ ካፌዎች</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-serif font-black leading-[0.88] tracking-tightest mb-8">
          The POS that<br/>
          <span className="text-[#D49E4A]">speaks Amharic.</span>
        </h1>

        <p className="text-lg md:text-xl opacity-60 max-w-2xl mx-auto leading-relaxed mb-4">
          Telebirr payments, offline ordering, ERCA receipts, and EFY reports — all in one system designed from day one for Addis Ababa.
        </p>
        <p className="text-base opacity-40 mb-12">
          ቴሌብር፣ ኢንተርኔት ሳያስፈልግ ትዕዛዝ፣ ERCA ደረሰኝ፣ እና EFY ሪፖርት — ሁሉም አንድ ላይ።
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={() => {
              localStorage.setItem('jan_venue_slug', 'demo-cafe');
              setView('customer');
            }}
            className="px-10 py-5 bg-[#D49E4A] text-white rounded-full text-sm font-black uppercase tracking-widest shadow-[0_10px_40px_rgba(212,158,74,0.35)] hover:shadow-[0_15px_50px_rgba(212,158,74,0.55)] hover:-translate-y-1 transition-all">
            Interactive Demo →
          </button>
          <button onClick={() => setView('register')}
            className="px-10 py-5 bg-[#120B05] text-white rounded-full text-sm font-black uppercase tracking-widest hover:-translate-y-1 transition-all">
            ነጻ ሙከራ ጀምር / Start Free Trial
          </button>
        </div>

        {/* Social proof strip */}
        <div className="mt-16 flex justify-center gap-8 flex-wrap">
          {['50+ Cafes', 'Addis Ababa', 'Hawassa', 'Dire Dawa'].map(c => (
            <span key={c} className="text-[10px] font-black uppercase tracking-widest text-black/20">{c}</span>
          ))}
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section className="py-24 px-6 bg-[#120B05]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-black text-white tracking-tightest">
              Built different.<br /><span className="text-[#D49E4A]">For Ethiopia.</span>
            </h2>
            <p className="text-white/40 mt-4 text-sm max-w-xl mx-auto">
              Generic POS systems retrofitted for Ethiopia always fail. We built Jan Systems with Ethiopian constraints as hard requirements from day one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="group p-8 rounded-[30px] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#D49E4A]/30 transition-all duration-500 cursor-default">
                <f.icon size={24} className="text-[#D49E4A] mb-5" />
                <h3 className="text-white font-black text-lg tracking-tight mb-1">{f.title}</h3>
                <p className="text-[#D49E4A] text-[10px] font-black uppercase tracking-widest mb-3">{f.am}</p>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-serif font-black tracking-tightest mb-12">ደንበኞቻችን ምን ይላሉ</h2>
        <div className="glass p-10 rounded-[40px] shadow-xl border border-black/5 min-h-[160px] flex flex-col justify-center">
          <p className="text-lg leading-relaxed text-[#120B05]/80 mb-6 italic">"{TESTIMONIALS[activeTestimonial].text}"</p>
          <div>
            <p className="font-black text-[#120B05]">{TESTIMONIALS[activeTestimonial].name}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#D49E4A]">{TESTIMONIALS[activeTestimonial].role}</p>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-6">
          {TESTIMONIALS.map((_, i) => (
            <button key={i} onClick={() => setActiveTestimonial(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === activeTestimonial ? 'bg-[#D49E4A] w-6' : 'bg-black/15'}`} />
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 px-6 bg-[#120B05]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-black text-white tracking-tightest">ዋጋ / Pricing</h2>
            <p className="text-white/40 mt-3 text-sm">In Ethiopian Birr. No hidden fees. No forex surprises.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name}
                className={`p-8 rounded-[36px] flex flex-col ${plan.highlight ? 'bg-[#D49E4A] shadow-[0_20px_60px_rgba(212,158,74,0.3)] -translate-y-3' : 'bg-white/5 border border-white/10'}`}>
                {plan.highlight && (
                  <span className="text-[#120B05] text-[9px] font-black uppercase tracking-widest bg-white/30 px-3 py-1 rounded-full self-start mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className={`text-2xl font-black tracking-tight mb-2 ${plan.highlight ? 'text-white' : 'text-white'}`}>{plan.name}</h3>
                <div className={`text-5xl font-serif font-black mb-1 ${plan.highlight ? 'text-white' : 'text-[#D49E4A]'}`}>
                  {plan.price === 'ተነጋጋሪ' ? <span className="text-3xl">ተነጋጋሪ</span> : <>ETB {plan.price}</>}
                </div>
                {plan.period && <p className={`text-sm mb-6 ${plan.highlight ? 'text-white/70' : 'text-white/40'}`}>{plan.period} ({plan.en})</p>}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-3 text-sm ${plan.highlight ? 'text-white' : 'text-white/60'}`}>
                      <Check size={14} className={plan.highlight ? 'text-white' : 'text-[#D49E4A]'} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setView('register')}
                  className={`w-full py-4 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${
                    plan.highlight
                      ? 'bg-white text-[#D49E4A] hover:bg-[#120B05] hover:text-white'
                      : plan.price === 'ተነጋጋሪ'
                        ? 'border border-white/20 text-white hover:bg-white hover:text-[#120B05]'
                        : 'bg-[#D49E4A] text-white hover:bg-white hover:text-[#120B05]'
                  }`}>
                  {plan.price === 'ተነጋጋሪ' ? 'Contact Sales' : 'ሙከራ ጀምር / Start Trial'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="py-24 px-6 text-center max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-serif font-black tracking-tightest mb-6">
          Ready to modernize<br />your cafe?
        </h2>
        <p className="text-black/50 mb-10">ካፌዎን ዘመናዊ ለማድረግ ዝግጁ ነዎት? Jan Systems ቡድን ዛሬ ሊረዳዎ ይችላል።</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={() => setView('register')}
            className="px-10 py-5 bg-[#120B05] text-white rounded-full font-black uppercase tracking-widest text-sm shadow-2xl hover:-translate-y-1 transition-all">
            ነጻ ሙከራ ጀምር →
          </button>
          <button onClick={() => {
              localStorage.setItem('jan_venue_slug', 'demo-cafe');
              setView('customer');
            }}
            className="px-10 py-5 border-2 border-black/10 rounded-full font-black uppercase tracking-widest text-sm hover:border-[#D49E4A] transition-all">
            Interactive Demo
          </button>
        </div>
        <p className="mt-12 text-[10px] uppercase tracking-widest font-black text-black/20">
          Jan Systems • Addis Ababa, Ethiopia • +251 911 000 000
        </p>
      </section>
    </div>
  );
}
