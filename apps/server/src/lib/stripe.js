// apps/server/src/lib/stripe.js
// Graceful Stripe initialisation — works without real API key in dev/demo mode
const key = process.env.STRIPE_SECRET_KEY;
const isLive = key && !key.startsWith('sk_test_...') && key !== 'sk_test_...' && key.length > 20;

let stripe;

if (isLive) {
  const Stripe = (await import('stripe')).default;
  stripe = new Stripe(key);
} else {
  // Mock Stripe — logs warnings instead of crashing
  const warn = (method) => (...args) => {
    console.warn(`[Stripe Mock] ${method}() called without live key — skipping.`);
    return Promise.resolve({ id: 'mock_' + Date.now(), url: null });
  };

  stripe = {
    customers: { create: warn('customers.create'), update: warn('customers.update') },
    checkout: { sessions: { create: warn('checkout.sessions.create') } },
    webhooks: {
      constructEvent: (body, sig, secret) => {
        console.warn('[Stripe Mock] constructEvent() — returning raw body as event.');
        return typeof body === 'string' ? JSON.parse(body) : body;
      }
    },
    subscriptions: { retrieve: warn('subscriptions.retrieve'), update: warn('subscriptions.update') },
    _isMock: true,
  };
  console.log('⚠  Stripe running in MOCK mode (no live key configured)');
}

export default stripe;
