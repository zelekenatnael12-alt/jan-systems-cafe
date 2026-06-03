import express from 'express';
import { z } from 'zod';
import * as tableService from '../services/tableService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const tableSchema = z.object({
  number: z.number().int().positive(),
  zone: z.string().min(1),
  seats: z.number().int().positive()
});

const statusSchema = z.object({
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLOSED'])
});

router.get('/', async (req, res) => {
  try {
    const venueId = req.venueId || req.query.venueId || req.headers['x-venue-id'];
    if (!venueId) throw new Error('Venue identification required.');
    const tables = await tableService.getAllTables(venueId);
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/status', authenticate, authorize(['ADMIN', 'STAFF']), validate(statusSchema), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updated = await tableService.updateTableStatus(req.venueId, id, status, req.io);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize(['ADMIN', 'OWNER']), validate(tableSchema), async (req, res) => {
  try {
    const table = await tableService.createTable(req.venueId, req.body);
    req.io.emit('table:updated', table);
    res.json(table);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize(['ADMIN', 'OWNER']), validate(tableSchema), async (req, res) => {
  const { id } = req.params;
  try {
    const table = await tableService.updateTable(req.venueId, id, req.body);
    req.io.emit('table:updated', table);
    res.json(table);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
