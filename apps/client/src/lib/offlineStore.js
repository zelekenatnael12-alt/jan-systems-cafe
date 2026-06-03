// apps/client/src/lib/offlineStore.js
// ─────────────────────────────────────────────────────────────────────────────
// Phase 3: Offline-First Order Queue — IndexedDB Implementation
//
// Architecture:
//   - Orders placed while offline are saved to IndexedDB as "pending"
//   - When connectivity restores, Background Sync / manual flush sends them
//   - Conflicts are handled by the server's idempotency key (orderId)
//   - Queue capacity: up to 8 hours of typical cafe traffic (~200 orders)
//
// DB Name: jan_offline_v1
// Stores:
//   - pendingOrders   — orders queued for POST /api/orders
//   - pendingPayments — payments queued for POST /api/payments
//   - syncLog         — record of completed syncs for audit
// ─────────────────────────────────────────────────────────────────────────────

const DB_NAME    = 'jan_offline_v1';
const DB_VERSION = 1;

// ─── Open DB ──────────────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // pendingOrders: offline orders waiting to be synced
      if (!db.objectStoreNames.contains('pendingOrders')) {
        const store = db.createObjectStore('pendingOrders', { keyPath: 'localId' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }

      // pendingPayments: payments for offline orders
      if (!db.objectStoreNames.contains('pendingPayments')) {
        const store = db.createObjectStore('pendingPayments', { keyPath: 'localId' });
        store.createIndex('orderId', 'localOrderId', { unique: false });
      }

      // syncLog: audit trail of all sync operations
      if (!db.objectStoreNames.contains('syncLog')) {
        const store = db.createObjectStore('syncLog', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    req.onsuccess  = (e) => resolve(e.target.result);
    req.onerror    = (e) => reject(e.target.error);
  });
}

// ─── Generic helpers ──────────────────────────────────────────────────────────
function txAdd(db, storeName, item) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).add(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function txGetAll(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function txDelete(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(key);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

function txUpdate(db, storeName, item) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put(item);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Queue an order for offline storage.
 * @param {object} orderData — same payload as POST /api/orders
 * @returns {string} localId — temporary local identifier
 */
export async function queueOrder(orderData) {
  const db      = await openDB();
  const localId = `offline-order-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const record = {
    localId,
    status:    'PENDING',   // PENDING | SYNCED | FAILED
    retries:   0,
    createdAt: new Date().toISOString(),
    payload:   orderData,
  };

  await txAdd(db, 'pendingOrders', record);
  console.log('[OfflineStore] Order queued:', localId);
  return localId;
}

/**
 * Queue a payment for an offline order.
 * @param {string} localOrderId — the localId returned by queueOrder
 * @param {object} paymentData  — payment payload
 */
export async function queuePayment(localOrderId, paymentData) {
  const db      = await openDB();
  const localId = `offline-payment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  await txAdd(db, 'pendingPayments', {
    localId,
    localOrderId,
    status:    'PENDING',
    createdAt: new Date().toISOString(),
    payload:   paymentData,
  });
  return localId;
}

/**
 * Get all pending (unsynced) orders.
 * @returns {Array} pending order records
 */
export async function getPendingOrders() {
  const db = await openDB();
  const all = await txGetAll(db, 'pendingOrders');
  return all.filter(r => r.status === 'PENDING' || r.status === 'FAILED');
}

/**
 * Get pending payments for a given local order ID.
 */
export async function getPendingPayments(localOrderId) {
  const db  = await openDB();
  const all = await txGetAll(db, 'pendingPayments');
  return all.filter(r => r.localOrderId === localOrderId && r.status === 'PENDING');
}

/**
 * Count all pending items (orders + payments) — shown in UI offline badge.
 */
export async function getPendingCount() {
  const db     = await openDB();
  const orders = await txGetAll(db, 'pendingOrders');
  const pmts   = await txGetAll(db, 'pendingPayments');
  return {
    orders:   orders.filter(r => r.status === 'PENDING').length,
    payments: pmts.filter(r => r.status === 'PENDING').length,
  };
}

/**
 * Flush all pending orders to the server.
 * Called when connectivity is restored (online event or manual trigger).
 * @param {string} token — JWT auth token
 * @param {string} apiBase — VITE_API_URL
 * @returns {{ synced: number, failed: number }}
 */
export async function flushPendingOrders(token, apiBase) {
  const db      = await openDB();
  const pending = await getPendingOrders();

  let synced = 0;
  let failed = 0;

  for (const record of pending) {
    try {
      // 1. Create the order on the server
      const orderRes = await fetch(`${apiBase}/api/orders`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Offline-Local-Id': record.localId, // Idempotency key
        },
        body: JSON.stringify(record.payload),
      });

      if (!orderRes.ok) throw new Error(`Server responded ${orderRes.status}`);
      const serverOrder = await orderRes.json();

      // 2. Sync associated payments
      const pendingPayments = await getPendingPayments(record.localId);
      for (const pmt of pendingPayments) {
        try {
          await fetch(`${apiBase}/api/payments`, {
            method:  'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ ...pmt.payload, orderId: serverOrder.id }),
          });
          await txUpdate(db, 'pendingPayments', { ...pmt, status: 'SYNCED', serverOrderId: serverOrder.id });
        } catch (pmtErr) {
          console.error('[OfflineStore] Payment sync failed for', pmt.localId, pmtErr);
        }
      }

      // 3. Mark as synced
      await txUpdate(db, 'pendingOrders', { ...record, status: 'SYNCED', serverOrderId: serverOrder.id });
      synced++;

      // 4. Log
      await txAdd(db, 'syncLog', {
        timestamp:     new Date().toISOString(),
        localOrderId:  record.localId,
        serverOrderId: serverOrder.id,
        result:        'SYNCED',
      });

    } catch (err) {
      console.error('[OfflineStore] Order sync failed:', record.localId, err.message);
      await txUpdate(db, 'pendingOrders', {
        ...record,
        status:  'FAILED',
        retries: (record.retries || 0) + 1,
        lastError: err.message,
      });
      failed++;
    }
  }

  console.log(`[OfflineStore] Flush complete: ${synced} synced, ${failed} failed`);
  return { synced, failed };
}

/**
 * Clear all synced records older than 7 days (housekeeping).
 */
export async function clearSyncedRecords() {
  const db    = await openDB();
  const seven = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const orders = await txGetAll(db, 'pendingOrders');
  for (const r of orders) {
    if (r.status === 'SYNCED' && r.createdAt < seven) {
      await txDelete(db, 'pendingOrders', r.localId);
    }
  }
}

/**
 * useOfflineSync — React hook for offline-aware order placement.
 * Intercepts the order POST and either sends directly (online) or queues (offline).
 *
 * Usage:
 *   const { placeOrder, pendingCount, isSyncing } = useOfflineSync();
 */
import { useState, useEffect, useCallback } from 'react';

export function useOfflineSync() {
  const [isOnline,     setIsOnline]     = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState({ orders: 0, payments: 0 });
  const [isSyncing,    setIsSyncing]    = useState(false);
  const token   = localStorage.getItem('jan_token');
  const apiBase = import.meta.env.VITE_API_URL;

  // ── Track online status ──────────────────────────────────────────────────
  useEffect(() => {
    const goOnline  = () => { setIsOnline(true);  handleSync(); };
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);

    // Refresh pending count on mount
    refreshCount();

    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const refreshCount = async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  };

  const handleSync = useCallback(async () => {
    if (!token) return;
    setIsSyncing(true);
    try {
      const result = await flushPendingOrders(token, apiBase);
      await refreshCount();
      if (result.synced > 0) {
        console.log(`[Sync] ${result.synced} offline orders synced to server`);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [token, apiBase]);

  /**
   * placeOrder — wraps the order POST with offline fallback.
   * @param {object} orderData
   * @returns {{ success: boolean, offline: boolean, localId?: string, order?: object }}
   */
  const placeOrder = useCallback(async (orderData) => {
    if (!navigator.onLine) {
      const localId = await queueOrder(orderData);
      await refreshCount();
      return { success: true, offline: true, localId };
    }

    // Online — post directly
    const res = await fetch(`${apiBase}/api/orders`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body:    JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error(`Order failed: ${res.status}`);
    const order = await res.json();
    return { success: true, offline: false, order };
  }, [token, apiBase]);

  return { isOnline, pendingCount, isSyncing, placeOrder, syncNow: handleSync };
}
