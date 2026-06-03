// apps/client/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from './store/useStore';
import { useI18n } from './lib/i18n';
import { useOfflineSync } from './lib/offlineStore';
import { getAuthHeaders, getVenueSlug, getUser, getVenueIdFromToken, clearLogin, storeLogin } from './lib/venueResolver';
import { WifiOff, RefreshCw, LogOut } from 'lucide-react';
import CustomerView from './views/CustomerView';
import KitchenView from './views/KitchenView';
import AdminView from './views/AdminView';
import OwnerView from './views/OwnerView';
import WaiterView from './views/WaiterView';
import SetupWizard from './views/SetupWizard';
import SuperadminPanel from './views/SuperadminPanel';
import RegisterView from './views/RegisterView';
import LandingView from './views/LandingView';
import PaywallView from './views/PaywallView';

const API = import.meta.env.VITE_API_URL;

const App = () => {
  const { view, setView, initSocket, config, setConfig, lang, setLang } = useStore();
  const { t } = useI18n();
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync();
  const [isInitialized, setIsInitialized] = useState(true);
  const [loading, setLoading] = useState(true);
  const [paywallCode, setPaywallCode] = useState(null); // 'TRIAL_EXPIRED' | 'SUBSCRIPTION_REQUIRED' | null

  const user = getUser();
  const isLoggedIn = !!localStorage.getItem('jan_token');

  useEffect(() => {
    initSocket();
    const checkSetup = async () => {
      try {
        // Venue resolution priority:
        // 1. JWT venueId (for logged-in users)
        // 2. URL slug (/venue/buna-and-co or ?venue=buna-and-co)
        // 3. Default to 'demo-cafe' for public demo access
        const venueIdFromToken = getVenueIdFromToken();
        const venueSlug = getVenueSlug() || 'demo-cafe';
        const venueIdentifier = venueIdFromToken || venueSlug;

        const [sRes, cRes] = await Promise.all([
          axios.get(`${API}/api/config/setup/status`, { params: { venueId: venueIdentifier } }),
          axios.get(`${API}/api/config`, { params: { venueId: venueIdentifier } })
        ]);
        setIsInitialized(sRes.data.initialized);
        setConfig(cRes.data);

        if (cRes.data) {
          document.documentElement.style.setProperty('--primary-color', cRes.data.primaryColor || '#1C1209');
          document.documentElement.style.setProperty('--secondary-color', cRes.data.secondaryColor || '#C8873A');
          document.title = cRes.data.cafeName || 'Jan Systems';
        }

        // Apply Amharic lang attribute
        const savedLang = localStorage.getItem('jan_lang') || 'EN';
        document.documentElement.lang = savedLang === 'AM' ? 'am' : 'en';

        // View interception
        const urlParams = new URLSearchParams(window.location.search);
        const forceView = urlParams.get('view');
        
        if (forceView === 'landing') {
          localStorage.removeItem('jan_venue_slug');
          setView('landing');
        } else if (forceView === 'register') {
          setView('register');
        } else if (window.location.pathname === '/' && !isLoggedIn && !localStorage.getItem('jan_venue_slug')) {
          setView('landing');
        }
      } catch (err) {
        console.error('Initial check failed', err);
      } finally {
        setLoading(false);
      }
    };

    checkSetup();

    // ── AXIOS INTERCEPTORS ──
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('jan_token');
      const venueSlug = getVenueSlug();
      
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Inject the venue ID header for all requests so the backend knows which tenant to serve
      if (venueSlug || getVenueIdFromToken()) {
        config.headers['x-venue-id'] = getVenueIdFromToken() || venueSlug;
      }
      return config;
    });

    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 402 — trial expired or subscription cancelled
        if (error.response?.status === 402) {
          const code = error.response.data?.code || 'SUBSCRIPTION_REQUIRED';
          setPaywallCode(code);
          return Promise.reject(error);
        }

        // Handle 401 — try token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem('jan_refresh_token');

          if (refreshToken) {
            try {
              const res = await axios.post(`${API}/api/auth/refresh`, { refreshToken });
              localStorage.setItem('jan_token', res.data.token);
              localStorage.setItem('jan_refresh_token', res.data.refreshToken);
              originalRequest.headers['Authorization'] = `Bearer ${res.data.token}`;
              return axios(originalRequest);
            } catch (refreshError) {
              clearLogin();
              window.location.reload();
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  // Logout handler
  const handleLogout = () => {
    clearLogin();
    setPaywallCode(null);
    window.location.reload();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-8 bg-[#FAF9F6]">
      <div className="relative">
        <img src="/logo.png" alt="Jan Systems" className="h-16 w-auto animate-pulse" />
      </div>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 bg-[#D49E4A] rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest text-black/20">Loading Jan Systems...</p>
    </div>
  );

  // Paywall — shown when API returns 402
  if (paywallCode) return <PaywallView code={paywallCode} onLogout={handleLogout} />;

  // Setup wizard for uninitialized venues
  if (!isInitialized) return <div className="min-h-screen bg-[#FAF9F6] pt-20"><SetupWizard onComplete={() => setIsInitialized(true)} /></div>;

  // Superadmin gets their own dedicated panel
  if (user?.role === 'SUPERADMIN') return <div className="min-h-screen bg-[#120B05] pt-20 px-10"><SuperadminPanel /></div>;

  // Landing page and registration (public views)
  if (view === 'landing') return <LandingView />;
  if (view === 'register') return <RegisterView />;

  return (
    <div
      className="min-h-screen font-sans text-[#120B05] selection:bg-[#D49E4A] selection:text-white"
      style={{ backgroundColor: '#FAF9F6' }}
    >
      {/* ── FLOATING NAVIGATION (Luxury Glass) ── */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50">
        <header className="glass-dark rounded-3xl p-2 flex items-center justify-between shadow-2xl">
          <div className="px-3 py-2 rounded-2xl" style={{ backgroundColor: config?.primaryColor || '#D49E4A' }}>
            <img src="/logo.png" alt="Jan Systems" className="h-5 w-auto brightness-0 invert" />
          </div>

          <nav className="flex gap-1 pr-2 items-center">
            {[
              { id: 'customer', label: t('order'),   roles: null },
              { id: 'waiter',   label: t('service'), roles: ['WAITER', 'ADMIN', 'OWNER', 'SUPERADMIN'] },
              { id: 'kitchen',  label: t('kitchen'),  roles: ['KITCHEN', 'ADMIN', 'OWNER', 'SUPERADMIN'] },
              { id: 'admin',    label: t('admin'),   roles: ['ADMIN', 'OWNER', 'SUPERADMIN'] },
              { id: 'owner',    label: t('owner'),   roles: ['OWNER', 'SUPERADMIN'] },
            ].filter(v => !v.roles || !user?.role || v.roles.includes(user.role)).map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`flex flex-col items-center px-3 py-2 rounded-2xl transition-all duration-500 ${
                  view === v.id ? 'bg-white/10 text-[#D49E4A]' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <span className="text-[9px] font-black uppercase tracking-widest">{v.label}</span>
              </button>
            ))}

            {/* ── Offline Indicator ── */}
            {(!isOnline || pendingCount.orders > 0) && (
              <button
                onClick={isOnline ? syncNow : undefined}
                title={isOnline ? `${pendingCount.orders} orders pending sync — click to sync` : 'No internet connection'}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all border ${
                  !isOnline
                    ? 'bg-red-500/20 border-red-500/30 text-red-400 animate-pulse'
                    : 'bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30 cursor-pointer'
                }`}>
                {isSyncing
                  ? <RefreshCw size={10} className="animate-spin" />
                  : <WifiOff size={10} />}
                {!isOnline ? 'Offline' : `${pendingCount.orders} pending`}
              </button>
            )}

            {/* ── Language Toggle ── */}
            <button
              id="lang-toggle-btn"
              onClick={() => {
                const next = lang === 'EN' ? 'AM' : 'EN';
                setLang(next);
                document.documentElement.lang = next === 'AM' ? 'am' : 'en';
              }}
              title={lang === 'EN' ? 'Switch to Amharic' : 'Switch to English'}
              className="ml-1 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/15 transition-all border border-white/10 group"
            >
              <span className="text-[9px] font-black tracking-widest text-white/70 group-hover:text-white">
                {lang === 'EN' ? 'አማ' : 'EN'}
              </span>
              <span className="text-[8px] text-white/30 group-hover:text-white/60">
                {lang === 'EN' ? '▸AM' : '▸EN'}
              </span>
            </button>

            {/* ── Logout (if logged in) ── */}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                title="Sign out"
                className="ml-1 p-2 rounded-2xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={12} />
              </button>
            )}
          </nav>

        </header>
      </div>

      {/* ── MAIN CONTENT (Silk Fade) ── */}
      <main className="pt-32 px-6 pb-24 max-w-7xl mx-auto animate-fade-in-up">
        {view === 'customer' && <CustomerView />}
        {view === 'waiter' && <WaiterView />}
        {view === 'kitchen' && <KitchenView />}
        {view === 'admin' && <AdminView />}
        {view === 'owner' && <OwnerView />}
      </main>

      {/* ── AMBIENT DECOR ── */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden opacity-30">
        <div
          className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]"
          style={{ backgroundColor: `${config?.primaryColor || '#D49E4A'}10` }}
        ></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#120B05]/5 rounded-full blur-[100px]"></div>
      </div>
    </div>
  );
};

export default App;
