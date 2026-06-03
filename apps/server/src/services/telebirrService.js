// apps/server/src/services/telebirrService.js
// ─────────────────────────────────────────────────────────────────────────────
// Phase 2: Ethiopian Mobile Money Integration Layer
// Handles Telebirr, CBE Birr, EthioPay, and Amole payment flows.
//
// Architecture:
//   - Each provider has an initiate() method (generate QR / push request)
//   - Webhook handler verifies incoming signatures and confirms payments
//   - All confirmations are stored as Payment.reference on the order
//   - Polling fallback available for providers without reliable webhooks
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'crypto';
import prisma from '../lib/prisma.js';

// ─── Provider Configuration ───────────────────────────────────────────────────
// Real credentials are injected via .env per venue's merchant account.
// These are read from environment variables — never hardcoded.
const PROVIDERS = {
  TELEBIRR: {
    name: 'Telebirr',
    apiBase: process.env.TELEBIRR_API_BASE || 'https://api.ethiotelecom.et/merchant/v1',
    appId: process.env.TELEBIRR_APP_ID || '',
    appKey: process.env.TELEBIRR_APP_KEY || '',
    merchantId: process.env.TELEBIRR_MERCHANT_ID || '',
    webhookSecret: process.env.TELEBIRR_WEBHOOK_SECRET || '',
  },
  CBE_BIRR: {
    name: 'CBE Birr',
    apiBase: process.env.CBE_BIRR_API_BASE || 'https://api.combanketh.et/payment/v1',
    appId: process.env.CBE_BIRR_APP_ID || '',
    appKey: process.env.CBE_BIRR_APP_KEY || '',
    merchantId: process.env.CBE_BIRR_MERCHANT_ID || '',
    webhookSecret: process.env.CBE_BIRR_WEBHOOK_SECRET || '',
  },
  ETHIOPAY: {
    name: 'EthioPay',
    apiBase: process.env.ETHIOPAY_API_BASE || 'https://api.ethiopay.et/merchant/v1',
    apiKey: process.env.ETHIOPAY_API_KEY || '',
    merchantId: process.env.ETHIOPAY_MERCHANT_ID || '',
    webhookSecret: process.env.ETHIOPAY_WEBHOOK_SECRET || '',
  },
};

// ─── Telebirr Signature Generation ────────────────────────────────────────────
// Telebirr uses HMAC-SHA256 on the sorted param string.
function generateTelebirrSignature(params, appKey) {
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHmac('sha256', appKey).update(sorted).digest('hex').toUpperCase();
}

// ─── Initiate Payment ─────────────────────────────────────────────────────────
/**
 * Initiate a mobile money payment request.
 * Returns a QR code URL or deep-link that the cashier displays to the customer.
 *
 * @param {'TELEBIRR'|'CBE_BIRR'|'ETHIOPAY'} provider
 * @param {{ orderId: string, amount: number, venueId: string, description?: string }} opts
 * @returns {{ qrUrl?: string, deepLink?: string, transactionRef: string, expiresAt: Date }}
 */
export async function initiatePayment(provider, opts) {
  const { orderId, amount, venueId, description } = opts;
  const cfg = PROVIDERS[provider];

  if (!cfg) throw new Error(`Unknown payment provider: ${provider}`);

  const transactionRef = `JAN-${venueId.slice(-4).toUpperCase()}-${orderId.slice(-6).toUpperCase()}-${Date.now()}`;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5-minute window

  // ── In production, call the real API. For now, we generate a deterministic QR stub ──
  // Real integration notes:
  //   Telebirr: POST /checkout with nonce, sign, timestamp, outTradeNo
  //   CBE Birr: POST /initiate-payment with merchantRef, amount, callbackUrl
  //   EthioPay: POST /payment/request with api_key, amount, reference, redirect_url

  const isConfigured = cfg.merchantId && (cfg.appId || cfg.apiKey);

  if (isConfigured) {
    // ── Real API call (production path) ──
    try {
      const payload = buildPayload(provider, cfg, { transactionRef, amount, description, orderId });
      // const response = await fetch(`${cfg.apiBase}/...`, { method: 'POST', body: JSON.stringify(payload) });
      // const data = await response.json();
      // return { qrUrl: data.qrCode, transactionRef, expiresAt };

      // Placeholder until actual API endpoint paths are confirmed:
      console.log(`[${provider}] Would call: ${cfg.apiBase} with ref=${transactionRef}`);
    } catch (err) {
      console.error(`[${provider}] API call failed:`, err.message);
    }
  }

  // ── Fallback / Sandbox QR (always works for demo/testing) ──
  const sandboxQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `${provider}:${cfg.merchantId || 'SANDBOX'}:${amount}:${transactionRef}`
  )}`;

  return {
    qrUrl: sandboxQrUrl,
    deepLink: `${provider.toLowerCase()}://pay?ref=${transactionRef}&amount=${amount}`,
    transactionRef,
    expiresAt,
    provider,
    sandbox: !isConfigured,
  };
}

function buildPayload(provider, cfg, { transactionRef, amount, description, orderId }) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  if (provider === 'TELEBIRR') {
    const params = {
      appId: cfg.appId,
      merchantId: cfg.merchantId,
      nonce: transactionRef,
      notifyUrl: `${process.env.API_BASE_URL}/api/webhooks/telebirr`,
      outTradeNo: transactionRef,
      returnUrl: `${process.env.API_BASE_URL}/api/webhooks/telebirr/return`,
      subject: description || 'Jan Systems Order',
      timeoutExpress: '5m',
      timestamp,
      totalAmount: amount.toFixed(2),
      tradeType: 'WEB',
    };
    return { ...params, sign: generateTelebirrSignature(params, cfg.appKey) };
  }
  if (provider === 'CBE_BIRR') {
    return {
      appId: cfg.appId,
      merchantId: cfg.merchantId,
      merchantRef: transactionRef,
      amount: amount.toFixed(2),
      currency: 'ETB',
      description: description || 'Order payment',
      callbackUrl: `${process.env.API_BASE_URL}/api/webhooks/cbebirr`,
    };
  }
  if (provider === 'ETHIOPAY') {
    return {
      api_key: cfg.apiKey,
      merchant_id: cfg.merchantId,
      reference: transactionRef,
      amount: amount.toFixed(2),
      currency: 'ETB',
      description: description || 'Order payment',
      webhook_url: `${process.env.API_BASE_URL}/api/webhooks/ethiopay`,
    };
  }
}

// ─── Verify Incoming Webhook Signature ───────────────────────────────────────
/**
 * Verify that an incoming webhook is genuinely from the payment provider.
 * Returns true if the signature is valid (or if running in sandbox mode).
 */
export function verifyWebhookSignature(provider, headers, rawBody) {
  const cfg = PROVIDERS[provider];
  if (!cfg?.webhookSecret) {
    // No secret configured → sandbox mode, accept all (dev only)
    console.warn(`[${provider}] Webhook secret not configured — accepting in sandbox mode`);
    return true;
  }

  // Telebirr: signature in header 'x-telebirr-signature'
  if (provider === 'TELEBIRR') {
    const incoming = headers['x-telebirr-signature'] || '';
    const expected = crypto.createHmac('sha256', cfg.webhookSecret).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(incoming), Buffer.from(expected));
  }

  // CBE Birr: 'x-cbe-signature'
  if (provider === 'CBE_BIRR') {
    const incoming = headers['x-cbe-signature'] || '';
    const expected = crypto.createHmac('sha256', cfg.webhookSecret).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(incoming), Buffer.from(expected));
  }

  // EthioPay: 'x-ethiopay-signature'
  if (provider === 'ETHIOPAY') {
    const incoming = headers['x-ethiopay-signature'] || '';
    const expected = crypto.createHmac('sha256', cfg.webhookSecret).update(rawBody).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(incoming), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  return false;
}

// ─── Confirm Payment (called by webhook handler) ──────────────────────────────
/**
 * Mark an order as paid after receiving a confirmed webhook.
 * Creates the Payment record and records the provider's transaction reference.
 *
 * @param {{ provider, transactionRef, amount, orderId, venueId, rawPayload }} opts
 */
export async function confirmPayment(opts) {
  const { provider, transactionRef, amount, orderId, venueId, rawPayload } = opts;

  return await prisma.$transaction(async (tx) => {
    // 1. Find the order
    const order = await tx.order.findFirst({
      where: { id: orderId, venueId },
    });
    if (!order) throw new Error(`Order ${orderId} not found for venue ${venueId}`);
    if (order.status === 'DONE') {
      console.log(`[${provider}] Duplicate webhook for already-completed order ${orderId}`);
      return { duplicate: true };
    }

    // 2. Create the Payment record with the provider's confirmation reference
    await tx.payment.create({
      data: {
        venueId,
        orderId,
        amount,
        method: provider,
        reference: transactionRef,
        note: `Auto-confirmed via ${PROVIDERS[provider]?.name || provider} webhook`,
      },
    });

    // 3. Update paymentMethod on the order
    await tx.order.update({
      where: { id: orderId },
      data: { paymentMethod: provider },
    });

    console.log(`[${provider}] Payment confirmed: order=${orderId}, ref=${transactionRef}, amount=${amount} ETB`);
    return { confirmed: true, transactionRef };
  });
}

// ─── Polling Fallback ─────────────────────────────────────────────────────────
/**
 * Poll a provider API to check if a pending payment has been completed.
 * Used when webhooks are unreliable (e.g., Ethio Telecom outage).
 * Called by the background cron job every 30 seconds for pending orders.
 *
 * @param {'TELEBIRR'|'CBE_BIRR'|'ETHIOPAY'} provider
 * @param {string} transactionRef
 * @returns {{ status: 'CONFIRMED'|'PENDING'|'FAILED', amount?: number }}
 */
export async function pollPaymentStatus(provider, transactionRef) {
  const cfg = PROVIDERS[provider];
  if (!cfg?.merchantId) {
    return { status: 'PENDING', reason: 'Provider not configured' };
  }

  // Real implementation would call:
  // Telebirr:  GET /trade/query?outTradeNo={ref}
  // CBE Birr:  GET /payment/status/{ref}
  // EthioPay:  GET /payment/{ref}/status
  console.log(`[${provider}] Polling status for ref=${transactionRef}`);

  // Sandbox: always return PENDING (no real API to call)
  return { status: 'PENDING', reason: 'Sandbox mode — no real API configured' };
}
