// apps/server/src/routes/owner.routes.js
import express from 'express';
import * as ownerService from '../services/ownerService.js';
import * as authService from '../services/authService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import stripe from '../lib/stripe.js';

const router = express.Router();

// ── BRIEFING & ANALYTICS ──
router.get('/briefing', authenticate, authorize(['OWNER']), async (req, res) => {
  try { res.json(await ownerService.getBriefing(req.venueId)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/revenue', authenticate, authorize(['OWNER']), async (req, res) => {
  try { res.json(await ownerService.getRevenueAnalytics(req.venueId)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/payments', authenticate, authorize(['OWNER']), async (req, res) => {
  try { res.json(await ownerService.getPaymentBreakdown(req.venueId)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/margins', authenticate, authorize(['OWNER']), async (req, res) => {
  try { res.json(await ownerService.getMarginAnalysis(req.venueId)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/alerts', authenticate, authorize(['OWNER']), async (req, res) => {
  try { res.json(await ownerService.getAlerts(req.venueId)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── EFY REPORT (Phase 4) ──
// Returns 13-month revenue breakdown in Ethiopian Fiscal Year calendar.
router.get('/efy-report', authenticate, authorize(['OWNER']), async (req, res) => {
  try { res.json(await ownerService.getEfyReport(req.venueId)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── USER MANAGEMENT ──
router.get('/users', authenticate, authorize(['OWNER', 'ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { venueId: req.venueId },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/users', authenticate, authorize(['OWNER', 'ADMIN']), async (req, res) => {
  try {
    const userData = { ...req.body, venueId: req.venueId };
    const user = await authService.register(userData);
    res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (e) { res.status(400).json({ error: 'Registration failed or email exists' }); }
});

router.patch('/users/:id', authenticate, authorize(['OWNER']), async (req, res) => {
  try {
    const updated = await prisma.user.update({
      where: { id: req.params.id, venueId: req.venueId },
      data: { role: req.body.role, name: req.body.name },
      select: { id: true, email: true, name: true, role: true }
    });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Update failed' }); }
});

router.delete('/users/:id', authenticate, authorize(['OWNER']), async (req, res) => {
  try {
    if (req.user.id === req.params.id) return res.status(400).json({ error: 'Cannot delete self' });
    await prisma.user.delete({ where: { id: req.params.id, venueId: req.venueId } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Deletion failed' }); }
});

// ── SETTINGS ──
router.get('/settings', authenticate, authorize(['OWNER', 'ADMIN']), async (req, res) => {
  try {
    const settings = await prisma.settings.findMany({ where: { venueId: req.venueId } });
    const map = {};
    settings.forEach(s => map[s.key] = s.value);
    res.json(map);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/settings', authenticate, authorize(['OWNER']), async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await prisma.settings.upsert({
        where: { venueId_key: { venueId: req.venueId, key } },
        update: { value: String(value) },
        create: { venueId: req.venueId, key, value: String(value) }
      });
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ERCA CONFIG (Phase 1) ──
// Allows owner to update TIN, VAT, Fiscal Device ID from the dashboard.
router.patch('/erca', authenticate, authorize(['OWNER']), async (req, res) => {
  try {
    const { tin, vatNumber, fiscalDeviceId, taxpayerCategory } = req.body;
    const updated = await prisma.cafeConfig.update({
      where: { venueId: req.venueId },
      data: {
        ...(tin !== undefined && { tin }),
        ...(vatNumber !== undefined && { vatNumber }),
        ...(fiscalDeviceId !== undefined && { fiscalDeviceId }),
        ...(taxpayerCategory !== undefined && { taxpayerCategory }),
      }
    });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── BILLING ──
router.post('/billing/portal', authenticate, authorize(['OWNER']), async (req, res) => {
  try {
    const venue = await prisma.venue.findUnique({ where: { id: req.venueId } });
    if (!venue.stripeCustomerId) return res.status(400).json({ error: 'No billing account found' });
    const session = await stripe.billingPortal.sessions.create({
      customer: venue.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/admin/settings`,
    });
    res.json({ url: session.url });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
