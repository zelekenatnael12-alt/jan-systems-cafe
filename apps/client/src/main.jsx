import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { flushPendingOrders } from './lib/offlineStore.js'

// ── Service Worker Registration (Phase 3 Offline Mode) ────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('[SW] Registered:', reg.scope);

      // Pre-cache critical API data for offline ordering
      if (reg.active) {
        reg.active.postMessage({ type: 'CACHE_MENU' });
      }

      // Listen for SYNC_NOW messages from the SW (Background Sync callback)
      navigator.serviceWorker.addEventListener('message', async (event) => {
        if (event.data?.type === 'SYNC_NOW') {
          const token   = localStorage.getItem('jan_token');
          const apiBase = import.meta.env.VITE_API_URL;
          if (token) {
            console.log('[SW] Background sync triggered');
            await flushPendingOrders(token, apiBase);
          }
        }
      });
    } catch (err) {
      console.warn('[SW] Registration failed:', err);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

