// apps/client/src/store/useStore.js
import { create } from 'zustand';
import { io } from 'socket.io-client';
import { getUser, clearLogin } from '../lib/venueResolver';

export const socket = io(import.meta.env.VITE_API_URL);

export const formatETB = (amount) => {
  const config = useStore.getState().config;
  const symbol = config?.currencySymbol || 'ብር';
  if (amount % 1 === 0) return `${symbol} ${Math.round(amount)}`;
  return `${symbol} ${amount.toFixed(2)}`;
};

export const useStore = create((set, get) => ({
  view: new URLSearchParams(window.location.search).get('view') || 
        (window.location.pathname === '/' && !localStorage.getItem('jan_token') && !localStorage.getItem('jan_venue_slug') ? 'landing' : 'customer'),
  setView: (view) => set({ view }),
  config: null,
  setConfig: (config) => set({ config }),

  // ── Language (EN | AM) — persisted to localStorage ──
  lang: localStorage.getItem('jan_lang') || 'EN',
  setLang: (lang) => {
    localStorage.setItem('jan_lang', lang);
    set({ lang });
  },

  // ── User & Auth ──
  user: getUser(),
  isAuthenticated: !!localStorage.getItem('jan_token'),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    clearLogin();
    set({ user: null, isAuthenticated: false, view: 'landing' });
  },

  menu: [],
  setMenu: (menu) => set({ menu }),

  cart: [],
  addItem: (product) => set((state) => {
    const existing = state.cart.find(item => item.id === product.id);
    if (existing) {
      return {
        cart: state.cart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      };
    }
    return { cart: [...state.cart, { ...product, quantity: 1 }] };
  }),
  removeItem: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.id !== productId)
  })),
  updateQty: (productId, quantity) => set((state) => ({
    cart: state.cart.map(item =>
      item.id === productId ? { ...item, quantity } : item
    )
  })),
  clearCart: () => set({ cart: [] }),

  activeOrder: null,
  setActiveOrder: (order) => set({ activeOrder: order }),

  inventory: [],
  setInventory: (inventory) => set({ inventory }),

  initSocket: () => {
    socket.on('order:updated', (updatedOrder) => {
      const currentOrder = get().activeOrder;
      if (currentOrder && updatedOrder.id === currentOrder.id) {
        set({ activeOrder: updatedOrder });
      }
    });

    socket.on('inventory:updated', (updatedItem) => {
      set((state) => ({
        inventory: state.inventory.map(item =>
          item.id === updatedItem.id ? { ...item, ...updatedItem } : item
        )
      }));
    });
  }
}));
