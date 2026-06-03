import express from 'express';
import stripe from '../lib/stripe.js';
import prisma from '../lib/prisma.js';
import { verifyWebhookSignature, confirmPayment } from '../services/telebirrService.js';

const router = express.Router();

router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { venueId, plan } = session.metadata;
      
      // Activate the venue
      await prisma.venue.update({
        where: { id: venueId },
        data: { 
          subscription: plan,
          subscriptionExpiresAt: null // Paid subscriptions don't "expire" in the same way as trials, or we'd handle it via subscription events
        }
      });
      console.log(`Venue ${venueId} activated for plan ${plan} via Stripe.`);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      // Find venue by stripe customer ID (requires adding stripeCustomerId to Venue model)
      // For now, let's assume we use metadata or find by email
      const customer = await stripe.customers.retrieve(customerId);
      const venueId = customer.metadata.venueId;

      if (venueId) {
        await prisma.venue.update({
          where: { id: venueId },
          data: { subscription: 'CANCELLED' }
        });
        console.log(`Venue ${venueId} subscription cancelled.`);
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// ─── Telebirr Webhook ─────────────────────────────────────────────────────────
// Telebirr POSTs to this URL when a customer completes payment.
// The payload includes: outTradeNo (our transactionRef), tradeStatus, totalAmount, tradeNo (Telebirr's own ref)
router.post('/telebirr', express.raw({ type: '*/*' }), async (req, res) => {
  const rawBody = req.body;
  const valid = verifyWebhookSignature('TELEBIRR', req.headers, rawBody);
  if (!valid) return res.status(401).json({ error: 'Invalid signature' });

  try {
    const payload = JSON.parse(rawBody.toString());
    const { outTradeNo, tradeStatus, totalAmount, tradeNo } = payload;

    if (tradeStatus !== 'TRADE_SUCCESS') {
      return res.json({ received: true, action: 'ignored', status: tradeStatus });
    }

    // outTradeNo format: JAN-{venue4}-{order6}-{timestamp}
    // Extract orderId from our transactionRef
    const parts = outTradeNo.split('-');
    const orderId = parts.length >= 3 ? parts[2] : null;

    if (!orderId) return res.status(400).json({ error: 'Cannot parse order from transactionRef' });

    const order = await prisma.order.findFirst({ where: { id: { contains: orderId.toLowerCase() } } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const result = await confirmPayment({
      provider: 'TELEBIRR',
      transactionRef: tradeNo || outTradeNo,
      amount: parseFloat(totalAmount),
      orderId: order.id,
      venueId: order.venueId,
      rawPayload: payload,
    });

    // Broadcast real-time confirmation to the POS cashier screen
    req.app.get('io')?.to('cashier').emit('payment:confirmed', {
      orderId: order.id,
      provider: 'TELEBIRR',
      transactionRef: tradeNo,
    });

    res.json({ received: true, ...result });
  } catch (err) {
    console.error('[TELEBIRR] Webhook error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── CBE Birr Webhook ─────────────────────────────────────────────────────────
router.post('/cbebirr', express.raw({ type: '*/*' }), async (req, res) => {
  const rawBody = req.body;
  const valid = verifyWebhookSignature('CBE_BIRR', req.headers, rawBody);
  if (!valid) return res.status(401).json({ error: 'Invalid signature' });

  try {
    const payload = JSON.parse(rawBody.toString());
    const { merchantRef, status, amount, transactionId } = payload;

    if (status !== 'SUCCESS') {
      return res.json({ received: true, action: 'ignored', status });
    }

    const parts = merchantRef.split('-');
    const orderId = parts.length >= 3 ? parts[2] : null;
    const order = await prisma.order.findFirst({ where: { id: { contains: (orderId || '').toLowerCase() } } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const result = await confirmPayment({
      provider: 'CBE_BIRR',
      transactionRef: transactionId || merchantRef,
      amount: parseFloat(amount),
      orderId: order.id,
      venueId: order.venueId,
      rawPayload: payload,
    });

    req.app.get('io')?.to('cashier').emit('payment:confirmed', {
      orderId: order.id,
      provider: 'CBE_BIRR',
      transactionRef: transactionId,
    });

    res.json({ received: true, ...result });
  } catch (err) {
    console.error('[CBE_BIRR] Webhook error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── EthioPay Webhook ─────────────────────────────────────────────────────────
router.post('/ethiopay', express.raw({ type: '*/*' }), async (req, res) => {
  const rawBody = req.body;
  const valid = verifyWebhookSignature('ETHIOPAY', req.headers, rawBody);
  if (!valid) return res.status(401).json({ error: 'Invalid signature' });

  try {
    const payload = JSON.parse(rawBody.toString());
    const { reference, payment_status, amount, transaction_id } = payload;

    if (payment_status !== 'COMPLETED') {
      return res.json({ received: true, action: 'ignored', status: payment_status });
    }

    const parts = reference.split('-');
    const orderId = parts.length >= 3 ? parts[2] : null;
    const order = await prisma.order.findFirst({ where: { id: { contains: (orderId || '').toLowerCase() } } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const result = await confirmPayment({
      provider: 'ETHIOPAY',
      transactionRef: transaction_id || reference,
      amount: parseFloat(amount),
      orderId: order.id,
      venueId: order.venueId,
      rawPayload: payload,
    });

    req.app.get('io')?.to('cashier').emit('payment:confirmed', {
      orderId: order.id,
      provider: 'ETHIOPAY',
      transactionRef: transaction_id,
    });

    res.json({ received: true, ...result });
  } catch (err) {
    console.error('[ETHIOPAY] Webhook error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;

