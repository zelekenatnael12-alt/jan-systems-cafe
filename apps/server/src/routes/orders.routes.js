import express from 'express';
import { z } from 'zod';
import * as orderService from '../services/orderService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const orderSchema = z.object({
  customer: z.string().optional(),
  tableId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive()
  })).min(1),
  total: z.number().nonnegative()
});

const statusSchema = z.object({
  status: z.enum(['NEW', 'PREPARING', 'READY', 'DONE', 'CANCELLED', 'VOIDED']),
  paymentMethod: z.enum(['CASH', 'TELEBIRR', 'CBE_BIRR', 'ETHIOPAY', 'BANK_TRANSFER', 'OTHER']).optional()
});

const voidSchema = z.object({
  reason: z.string().min(1)
});

router.get('/', authenticate, authorize(['OWNER', 'ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const orders = await orderService.getOrders(req.venueId, {}, Number(limit), Number(offset));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    // For now, allow venueId in body or header for customer orders
    const venueId = req.venueId || req.body.venueId || req.headers['x-venue-id'];
    if (!venueId) throw new Error('Venue identification required.');

    const order = await orderService.placeOrder(venueId, req.body);
    req.io.to('kitchen').emit('order:new', order);
    req.io.to('admin').emit('inventory:update');
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/status', authenticate, authorize(['ADMIN', 'STAFF']), validate(statusSchema), async (req, res) => {
  const { id } = req.params;
  const { status, paymentMethod } = req.body;
  try {
    const updated = await orderService.updateStatus(req.venueId, id, status, paymentMethod, req.io);
    req.io.emit('order:updated', updated);
    if (status === 'DONE') req.io.emit('order:completed', updated);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Status update failed' });
  }
});

router.post('/:id/void', authenticate, authorize(['OWNER', 'ADMIN']), validate(voidSchema), async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const updated = await orderService.voidOrder(req.venueId, id, reason, req.io);
    req.io.emit('order:updated', updated);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
