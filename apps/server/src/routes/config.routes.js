// apps/server/src/routes/config.routes.js
import express from 'express';
import * as configService from '../services/configService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get('/debug-file', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'menu.routes.js');
    const content = fs.readFileSync(filePath, 'utf8');
    res.send(content);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET /api/config — public (for loading venue theme/branding)
// Supports: venueId (cuid), venue slug, or x-venue-id header
router.get('/', async (req, res) => {
  try {
    let venueId = req.venueId || req.query.venueId || req.headers['x-venue-id'];
    if (!venueId) throw new Error('Venue identification required.');

    // If venueId looks like a slug (no cuid chars), resolve to actual ID
    if (venueId && !venueId.match(/^c[a-z0-9]{24}$/i)) {
      const venue = await prisma.venue.findUnique({ where: { slug: venueId } });
      if (venue) venueId = venue.id;
    }

    const config = await configService.getConfig(venueId);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/', authenticate, authorize(['OWNER', 'ADMIN']), async (req, res) => {
  try {
    const config = await configService.updateConfig(req.venueId, req.body);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/config/setup/status — public
// Returns whether the venue has been initialised (has a CafeConfig record)
router.get('/setup/status', async (req, res) => {
  try {
    let venueId = req.venueId || req.query.venueId || req.headers['x-venue-id'];
    if (!venueId) return res.json({ initialized: false });

    // Resolve slug to ID
    if (venueId && !venueId.match(/^c[a-z0-9]{24}$/i)) {
      const venue = await prisma.venue.findUnique({ where: { slug: venueId } });
      if (venue) venueId = venue.id;
      else return res.json({ initialized: false });
    }

    const config = await configService.getConfig(venueId);
    res.json({ initialized: !!config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
