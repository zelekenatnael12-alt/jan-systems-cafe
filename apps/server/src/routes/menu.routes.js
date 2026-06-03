import express from 'express';
import * as menuService from '../services/menuService.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

import prisma from '../lib/prisma.js';

router.get('/', async (req, res) => {
  try {
    let venueId = req.venueId || req.query.venueId || req.headers['x-venue-id'];
    if (!venueId) throw new Error('Venue identification required.');

    if (venueId && !venueId.match(/^c[a-z0-9]{24}$/i)) {
      const venue = await prisma.venue.findUnique({ where: { slug: venueId } });
      if (venue) venueId = venue.id;
    }

    const products = await menuService.getAllProducts(venueId);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize(['ADMIN', 'OWNER']), async (req, res) => {
  try {
    const product = await menuService.createProduct(req.venueId, req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', authenticate, authorize(['ADMIN', 'OWNER']), async (req, res) => {
  try {
    const product = await menuService.updateProduct(req.venueId, req.params.id, req.body);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, authorize(['ADMIN', 'OWNER']), async (req, res) => {
  try {
    await menuService.deleteProduct(req.venueId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
