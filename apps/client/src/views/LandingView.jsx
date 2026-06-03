// apps/client/src/views/LandingView.jsx
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  Wifi, Smartphone, Printer, Globe, ShieldCheck, BarChart3,
  ChevronRight, Check, Phone, MessageCircle, ArrowRight,
  Zap, Users, Clock, Star, Menu, X, PlayCircle
} from 'lucide-react';

const PHONE = '+251977717475';
const WHATSAPP_MSG = encodeURIComponent('ሰላም! Jan Systems ስለ ካፌ POS ሥርዓቱ መረጃ ያስፈልገኛል። Hello! I am interested in Jan Systems POS for my cafe.');
const WA_LINK = `https://wa.me/${PHONE}?text=${WHATSAPP_MSG}`;
const TG_LINK = 'https://t.me/jan_web_dev';

const FEATURES = [
  {
    icon: Wifi,
    title: 'Offline-First',
    am: 'ያለ ኢንተርኔት ይሠራል',
    desc: 'Orders queue locally during Ethio Telecom outages. Auto-syncs the moment connection returns. Zero lost orders.',
    color: '#22c55e',
  },
  {
    icon: Smartphone,
    title: 'Telebirr & CBE Birr',
    am: 'ቴሌብርና CBE ብር — ቅርቡ',
    desc: 'QR-code mobile payment integration coming soon. Currently supports Cash & Bank Transfer with full receipt tracking.',
    color: '#D49E4A',
    badge: 'Coming Soon',
  },
  {
    icon: ShieldCheck,
    title: 'ERCA Compliant',
    am: 'ERCA ደረሰኝ',
    desc: 'TIN, VAT, and fiscal device ID on every printed receipt. EFY monthly reports in Ge\'ez months for your accountant.',
    color: '#3b82f6',
  },
  {
    icon: Globe,
    title: 'Full Amharic UI',
    am: 'አማርኛ ይደግፋል',
    desc: 'One-tap language toggle between English and Amharic. KDS, receipts, menus — all bilingual.',
    color: '#8b5cf6',
  },
  {
    icon: Printer,
    title: '80mm Thermal Receipt',
    am: 'የሙቀት ደረሰኝ',
    desc: 'ESC/POS formatted printing. ERCA-standard header with dual date: Gregorian and Ethiopian (EFY) calendar.',
    color: '#D49E4A',
  },
  {
    icon: BarChart3,
    title: 'EFY Revenue Reports',
    am: 'ዓ.ም ሪፖርት',
    desc: 'Monthly revenue in Ethiopian Fiscal Year. Visual bar charts in ETB. Owner dashboard with live sales tracking.',
    color: '#22c55e',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'We set you up',
    am: 'እኛ እናዘጋጃለን',
    desc: 'Contact us on WhatsApp. We configure your menu, tables, and staff accounts — typically in under 24 hours.',
    icon: Phone,
  },
  {
    step: '02',
    title: 'Train your team',
    am: 'ቡድንዎን ያሠልጥኑ',
    desc: 'Your waiters, kitchen staff, and cashiers get role-specific tablets. Takes 30 minutes to learn.',
    icon: Users,
  },
  {
    step: '03',
    title: 'Go live & grow',
    am: 'ጀምሩ ያድጉ',
    desc: 'Real-time orders, live KDS, and daily revenue reports from day one. Cancel anytime — no contracts.',
    icon: Zap,
  },
];

const PLANS = [
  {
    name: 'Starter',
    nameAm: 'ጀማሪ',
    price: '1,990',
    period: '/ወር',
    en: '/month',
    features: [
      '1 POS tablet',
      'Cash payments',
      'Full Amharic UI',
      '80mm thermal receipt',
      'ERCA-compliant receipts',
      'WhatsApp support',
    ],
    highlight: false,
    cta: 'ሙከራ ጀምር',
  },
  {
    name: 'Pro',
    nameAm: 'ፕሮ',
    price: '3,490',
    period: '/ወር',
    en: '/month',
    features: [
      '2 POS tablets + KDS screen',
      'All payment methods',
      'Inventory tracking',
      'EFY revenue reports',
      'Staff shift management',
      'Priority WhatsApp support',
    ],
    highlight: true,
    cta: 'ሙከራ ጀምር',
  },
  {
    name: 'Enterprise',
    nameAm: 'ትልቅ ንግድ',
    price: 'ተነጋጋሪ',
    period: '',
    en: '',
    features: [
      'Unlimited venues & POS tablets',
      'Custom integrations',
      'Dedicated account manager',
      'On-site training',
      'SLA 4hr response',
      'Monthly business review',
    ],
    highlight: false,
    cta: 'Contact Sales',
  },
];

const TESTIMONIALS = [
  {
    name: 'Selam T.',
    role: 'Owner — Buna & Co., Bole',
    text: 'ከጀመርን ጀምሮ ዕለታዊ ሽያጭ 28% ጨምሯል። ስርዓቱ ለሠራተኞቼ ቀላል ሆኖ ተገኝቷል። (Sales up 28% since launch. My staff learned it in one day.)',
    rating: 5,
  },
  {
    name: 'Dawit M.',
    role: 'Manager — Kaldi\'s Coffee, Sarbet',
    text: 'The offline mode saved us during the fiber outage last month. Not a single order was lost. The kitchen screen alone was worth the subscription.',
    rating: 5,
  },
  {
    name: 'Hanan A.',
    role: 'Owner — Tomoca Piazza',
    text: 'EFY reports make my accountant\'s job so much easier. We never convert dates manually anymore. ዓ.ም ሪፖርቱ ለሂሳብ ሠሪዬ ትልቅ ጊዜ አድኗል።',
    rating: 5,
  },
];

const STATS = [
  { value: '15+', label: 'Active Venues', am: 'ንቁ ቦታዎች' },
  { value: '98%', label: 'Uptime', am: 'የስርዓት ስደናቀፍ' },
  { value: '24h', label: 'Setup time', am: 'የማዘጋጀት ጊዜ' },
  { value: 'ETB', label: 'Payments only', am: 'ብር ክፍያ' },
];

export default function LandingView() {
  const { setView } = useStore();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-rotate testimonials
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const goToDemo = () => {
    localStorage.setItem('jan_venue_slug', 'demo-cafe');
    setView('customer');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#120B05] font-sans selection:bg-[#D49E4A] selection:text-white overflow-x-hidden">

      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 backdrop-blur-xl bg-[#FAF9F6]/90 border-b border-black/5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Jan Systems" className="h-8 w-auto" />
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <a href="#features" className="text-[11px] font-black tracking-widest uppercase opacity-40 hover:opacity-100 transition-all">Features</a>
          <a href="#how" className="text-[11px] font-black tracking-widest uppercase opacity-40 hover:opacity-100 transition-all">How it Works</a>
          <a href="#pricing" className="text-[11px] font-black tracking-widest uppercase opacity-40 hover:opacity-100 transition-all">Pricing</a>
          <button
            onClick={() => setView('owner')}
            className="text-[11px] font-black tracking-widest uppercase opacity-40 hover:opacity-100 transition-all"
          >
            Sign In
          </button>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg"
          >
            <MessageCircle size={14} />
            WhatsApp
          </a>
          <button
            onClick={goToDemo}
            className="bg-[#120B05] text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Try Demo
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileMenuOpen(o => !o)} className="md:hidden p-2 rounded-xl bg-black/5">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#FAF9F6] pt-20 px-6 flex flex-col gap-4 animate-fade-in">
          <button onClick={goToDemo} className="w-full py-4 bg-[#D49E4A] text-white rounded-full font-black uppercase tracking-widest text-sm">Try Live Demo</button>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="w-full py-4 btn-whatsapp rounded-full font-black uppercase tracking-widest text-sm text-center flex items-center justify-center gap-2"><MessageCircle size={16} /> WhatsApp Us</a>
          <button onClick={() => setView('register')} className="w-full py-4 bg-[#120B05] text-white rounded-full font-black uppercase tracking-widest text-sm">Start Free Trial</button>
          <button onClick={() => setView('owner')} className="w-full py-4 border border-black/10 rounded-full font-black uppercase tracking-widest text-sm">Sign In</button>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="pt-36 pb-20 px-6 max-w-6xl mx-auto animate-fade-in-up">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#D49E4A]/10 border border-[#D49E4A]/20 px-4 py-2 rounded-full mb-8">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D49E4A]">ለኢትዮጵያ ካፌዎች — Live in Addis Ababa</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-serif font-black leading-[0.9] tracking-tight mb-6">
              The POS that<br />
              <span className="text-[#D49E4A]">speaks Amharic.</span>
            </h1>

            <p className="text-lg opacity-60 leading-relaxed mb-3">
              Telebirr payments, offline ordering, ERCA receipts, and EFY reports — all in one system built from day one for Ethiopian cafes.
            </p>
            <p className="text-base opacity-35 mb-10">
              ቴሌብር፣ ኢንተርኔት ሳያስፈልግ ትዕዛዝ፣ ERCA ደረሰኝ፣ EFY ሪፖርት — ሁሉም አንድ ላይ።
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button
                onClick={goToDemo}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-[#D49E4A] text-white rounded-full text-sm font-black uppercase tracking-widest shadow-[0_10px_40px_rgba(212,158,74,0.35)] hover:shadow-[0_15px_50px_rgba(212,158,74,0.55)] hover:-translate-y-1 transition-all"
              >
                <PlayCircle size={16} />
                Interactive Demo
              </button>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-8 py-4 btn-whatsapp rounded-full text-sm font-black uppercase tracking-widest"
              >
                <MessageCircle size={16} />
                ዋትስአፕ ይላኩ
              </a>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              {['30-day free trial', 'No credit card', 'Setup in 24hrs'].map(t => (
                <div key={t} className="flex items-center gap-1.5">
                  <Check size={12} className="text-green-500" />
                  <span className="text-[11px] font-black uppercase tracking-widest opacity-40">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product mockup / preview panel */}
          <div className="relative hidden md:block">
            <div className="relative bg-[#120B05] rounded-[32px] p-6 shadow-[0_40px_80px_rgba(18,11,5,0.25)] border border-white/5">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-2 mb-5">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
                <div className="flex-1 bg-white/5 rounded-full h-5 mx-4 flex items-center px-3">
                  <span className="text-[8px] text-white/30 font-mono">jan-systems-cafe-client.vercel.app</span>
                </div>
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[['ዛሬ ሽያጭ', 'ETB 4,250', '+12%'], ['ትዕዛዞች', '38', 'active'], ['ሠራተኞች', '4', 'on shift']].map(([label, val, sub]) => (
                  <div key={label} className="bg-white/5 rounded-2xl p-3 text-center">
                    <div className="text-[8px] text-white/30 font-black uppercase tracking-widest mb-1">{label}</div>
                    <div className="text-white font-serif font-black text-lg leading-none">{val}</div>
                    <div className="text-[8px] text-[#D49E4A] font-black mt-1">{sub}</div>
                  </div>
                ))}
              </div>

              {/* Fake order cards */}
              <div className="space-y-2">
                {[
                  { table: 'Table 4', items: 'Macchiato × 2, Sambusa × 1', status: 'READY', color: '#22c55e' },
                  { table: 'Table 7', items: 'Buna × 1, Firfir × 1', status: 'PREPARING', color: '#D49E4A' },
                  { table: 'VIP 1', items: 'Tej × 2, Tibs × 1', status: 'PENDING', color: '#60a5fa' },
                ].map(o => (
                  <div key={o.table} className="bg-white/5 rounded-xl px-4 py-3 flex justify-between items-center">
                    <div>
                      <div className="text-white font-black text-sm">{o.table}</div>
                      <div className="text-white/30 text-[9px] font-bold">{o.items}</div>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ backgroundColor: `${o.color}20`, color: o.color }}>{o.status}</span>
                  </div>
                ))}
              </div>

              {/* Language toggle badge */}
              <div className="absolute top-4 right-4 bg-[#D49E4A] text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                አማርኛ
              </div>
            </div>

            {/* Floating social proof */}
            <div className="absolute -bottom-6 -left-6 glass px-5 py-4 rounded-2xl shadow-xl border border-black/5 animate-floating">
              <div className="text-[9px] font-black uppercase tracking-widest text-black/30">Bole, Addis Ababa</div>
              <div className="font-serif font-black text-lg">ETB 128,400</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-green-500">+18% this month</div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.value} className="text-center p-6 rounded-[24px] bg-white border border-black/5 shadow-sm">
              <div className="text-3xl font-serif font-black text-[#120B05]">{s.value}</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-black/40 mt-1">{s.label}</div>
              <div className="text-[9px] font-black text-[#D49E4A] mt-0.5">{s.am}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section id="features" className="py-24 px-6 bg-[#120B05]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-black text-white tracking-tight">
              Built different.<br /><span className="text-[#D49E4A]">For Ethiopia.</span>
            </h2>
            <p className="text-white/40 mt-4 text-sm max-w-xl mx-auto">
              Generic POS systems retrofitted for Ethiopia always fail. Jan Systems was built with Ethiopian constraints as hard requirements from day one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="group p-8 rounded-[30px] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#D49E4A]/30 transition-all duration-500 cursor-default relative overflow-hidden"
              >
                {f.badge && (
                  <span className="absolute top-4 right-4 text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-[#D49E4A]/20 text-[#D49E4A]">
                    {f.badge}
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: `${f.color}20` }}>
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <h3 className="text-white font-black text-lg tracking-tight mb-1">{f.title}</h3>
                <p className="text-[#D49E4A] text-[10px] font-black uppercase tracking-widest mb-3">{f.am}</p>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-black tracking-tight">
            ጀምሩ in <span className="text-[#D49E4A]">24 hours.</span>
          </h2>
          <p className="text-black/40 mt-3 text-sm">No complicated installs. No IT department needed. Just WhatsApp us.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.step} className="relative text-center p-8 rounded-[32px] bg-white border border-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="text-[9px] font-black uppercase tracking-widest text-[#D49E4A] mb-4">{step.step}</div>
              <div className="w-12 h-12 bg-[#120B05] rounded-2xl flex items-center justify-center text-white mx-auto mb-5">
                <step.icon size={20} />
              </div>
              <h3 className="font-black text-xl mb-1">{step.title}</h3>
              <p className="text-[#D49E4A] text-[10px] font-black uppercase tracking-widest mb-3">{step.am}</p>
              <p className="text-black/50 text-sm leading-relaxed">{step.desc}</p>
              {i < HOW_IT_WORKS.length - 1 && (
                <ArrowRight size={20} className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 text-black/15 z-10" />
              )}
            </div>
          ))}
        </div>

        {/* Big WhatsApp CTA below How It Works */}
        <div className="mt-12 text-center">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 btn-whatsapp px-10 py-5 rounded-full text-sm font-black uppercase tracking-widest shadow-xl"
          >
            <MessageCircle size={18} />
            ቴሌፎን / WhatsApp ያግኙን — +251 977 717 475
          </a>
          <div className="mt-4">
            <a href={TG_LINK} target="_blank" rel="noopener noreferrer" className="text-[11px] font-black uppercase tracking-widest text-black/30 hover:text-[#D49E4A] transition-all">
              Telegram: @jan_web_dev
            </a>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-6 bg-[#120B05]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-serif font-black text-white tracking-tight mb-3">ደንበኞቻችን ምን ይላሉ</h2>
          <p className="text-white/30 text-sm mb-12">What our beta cafe owners say</p>

          <div className="glass p-10 rounded-[40px] shadow-xl border border-white/10 min-h-[180px] flex flex-col justify-center bg-white/5">
            {/* Stars */}
            <div className="flex justify-center gap-1 mb-6">
              {Array.from({ length: TESTIMONIALS[activeTestimonial].rating }).map((_, i) => (
                <Star key={i} size={16} className="text-[#D49E4A] fill-[#D49E4A]" />
              ))}
            </div>
            <p className="text-lg leading-relaxed text-white/80 mb-6 italic">
              "{TESTIMONIALS[activeTestimonial].text}"
            </p>
            <div>
              <p className="font-black text-white">{TESTIMONIALS[activeTestimonial].name}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#D49E4A]">{TESTIMONIALS[activeTestimonial].role}</p>
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`rounded-full transition-all duration-300 ${i === activeTestimonial ? 'bg-[#D49E4A] w-6 h-2' : 'bg-white/20 w-2 h-2'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-4xl md:text-5xl font-serif font-black tracking-tight">ዋጋ / Pricing</h2>
            <p className="text-black/40 mt-3 text-sm">In Ethiopian Birr. No forex. No hidden fees. Pay via Telebirr or bank.</p>
          </div>

          {/* Annual discount badge */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Zap size={12} />
              Pay annually — save 2 months free
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`p-8 rounded-[36px] flex flex-col ${
                  plan.highlight
                    ? 'bg-[#120B05] shadow-[0_20px_60px_rgba(18,11,5,0.25)] -translate-y-3 relative'
                    : 'bg-white border border-black/5 shadow-sm'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#D49E4A] text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                    Most Popular — ብዙዎች ይመርጣሉ
                  </span>
                )}

                <div className="mb-4">
                  <h3 className={`text-2xl font-black tracking-tight ${plan.highlight ? 'text-white' : 'text-[#120B05]'}`}>
                    {plan.name}
                  </h3>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${plan.highlight ? 'text-[#D49E4A]' : 'text-black/30'}`}>
                    {plan.nameAm}
                  </div>
                </div>

                <div className={`text-5xl font-serif font-black mb-1 ${plan.highlight ? 'text-[#D49E4A]' : 'text-[#120B05]'}`}>
                  {plan.price === 'ተነጋጋሪ'
                    ? <span className="text-3xl">ተነጋጋሪ</span>
                    : <>ETB {plan.price}</>
                  }
                </div>
                {plan.period && (
                  <p className={`text-sm mb-6 ${plan.highlight ? 'text-white/40' : 'text-black/30'}`}>
                    {plan.period} ({plan.en})
                  </p>
                )}

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-start gap-3 text-sm ${plan.highlight ? 'text-white/80' : 'text-black/60'}`}>
                      <Check size={14} className={`mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-[#D49E4A]' : 'text-green-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.price === 'ተነጋጋሪ' ? TG_LINK : WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-4 rounded-full font-black text-[10px] uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 ${
                    plan.highlight
                      ? 'btn-whatsapp shadow-lg'
                      : plan.price === 'ተነጋጋሪ'
                        ? 'border border-black/15 text-[#120B05] hover:border-[#D49E4A] hover:text-[#D49E4A]'
                        : 'bg-[#120B05] text-white hover:bg-[#D49E4A]'
                  }`}
                >
                  <MessageCircle size={12} />
                  {plan.price === 'ተነጋጋሪ' ? 'Contact Sales' : plan.cta}
                </a>
              </div>
            ))}
          </div>

          <p className="text-center text-[10px] font-black uppercase tracking-widest text-black/20 mt-8">
            All plans include 30-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 bg-[#120B05]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-black text-white tracking-tight mb-4">
            ካፌዎን ዘመናዊ<br /><span className="text-[#D49E4A]">ያድርጉ ዛሬ።</span>
          </h2>
          <p className="text-white/40 mb-10 text-sm">
            Ready to modernize your cafe? Our team will set you up in under 24 hours.<br />
            ቡድናችን ዛሬ ሊረዳዎ ይችላል — WhatsApp ወይም Telegram ያግኙን።
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 btn-whatsapp rounded-full font-black uppercase tracking-widest text-sm shadow-2xl"
            >
              <MessageCircle size={16} />
              WhatsApp ይላኩ
            </a>
            <button
              onClick={goToDemo}
              className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-full font-black uppercase tracking-widest text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <PlayCircle size={16} />
              Interactive Demo
            </button>
          </div>

          <div className="flex justify-center gap-8 flex-wrap mt-4">
            <a href={`tel:${PHONE}`} className="text-[11px] font-black uppercase tracking-widest text-white/30 hover:text-[#D49E4A] transition-all">
              📞 +251 977 717 475
            </a>
            <a href={TG_LINK} target="_blank" rel="noopener noreferrer" className="text-[11px] font-black uppercase tracking-widest text-white/30 hover:text-[#D49E4A] transition-all">
              ✈️ @jan_web_dev
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#120B05] border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Jan Systems" className="h-7 w-auto opacity-70" />
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <a href="#features" className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/60 transition-all">Features</a>
            <a href="#pricing" className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/60 transition-all">Pricing</a>
            <button onClick={goToDemo} className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/60 transition-all">Demo</button>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-[#D49E4A]/60 hover:text-[#D49E4A] transition-all">Contact</a>
          </div>

          <p className="text-[9px] uppercase tracking-widest font-black text-white/15 text-center">
            © 2025 Jan Systems • Addis Ababa, Ethiopia
          </p>
        </div>
      </footer>
    </div>
  );
}
