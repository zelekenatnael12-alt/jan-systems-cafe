// apps/server/src/routes/superadmin.routes.js
// SuperAdmin API — full platform control (SUPERADMIN role only)
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as venueService from '../services/venueService.js';
import prisma from '../lib/prisma.js';

const router = express.Router();
const guard  = [authenticate, authorize(['SUPERADMIN'])];

// ─── Platform Summary ─────────────────────────────────────────────────────────
router.get('/summary', ...guard, async (req, res) => {
  try { res.json(await venueService.getPlatformSummary()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── All Venues ───────────────────────────────────────────────────────────────
router.get('/venues', ...guard, async (req, res) => {
  try { res.json(await venueService.getAllVenues()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Provision New Venue ─────────────────────────────────────────────────────
router.post('/venues', ...guard, async (req, res) => {
  try {
    const result = await venueService.provisionVenue(req.body);
    res.status(201).json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─── Update Venue Plan ────────────────────────────────────────────────────────
router.patch('/venues/:id/plan', ...guard, async (req, res) => {
  try { res.json(await venueService.upgradeVenuePlan(req.params.id, req.body.plan)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Suspend / Activate Venue ─────────────────────────────────────────────────
router.patch('/venues/:id/status', ...guard, async (req, res) => {
  try { res.json(await venueService.setVenueStatus(req.params.id, req.body.status)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Delete Venue (hard delete — irreversible) ────────────────────────────────
router.delete('/venues/:id', ...guard, async (req, res) => {
  try {
    // Cascade delete is handled by Prisma schema relations
    await prisma.venue.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Get Venue Config ─────────────────────────────────────────────────────────
router.get('/venues/:id/config', ...guard, async (req, res) => {
  try {
    const cfg = await prisma.cafeConfig.findFirst({ where: { venueId: req.params.id } });
    res.json(cfg);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Update Venue Config (white-label override) ───────────────────────────────
router.patch('/venues/:id/config', ...guard, async (req, res) => {
  try {
    const cfg = await prisma.cafeConfig.findFirst({ where: { venueId: req.params.id } });
    if (!cfg) return res.status(404).json({ error: 'Config not found' });
    const updated = await prisma.cafeConfig.update({ where: { id: cfg.id }, data: req.body });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
