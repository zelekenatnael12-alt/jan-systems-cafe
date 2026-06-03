import express from 'express';
import * as inventoryService from '../services/inventoryService.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize(['ADMIN', 'OWNER']), async (req, res) => {
  try {
    const stock = await inventoryService.getAllStock(req.venueId);
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize(['ADMIN', 'OWNER']), async (req, res) => {
  try {
    const item = await inventoryService.createStockItem(req.venueId, req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', authenticate, authorize(['ADMIN', 'OWNER']), async (req, res) => {
  try {
    const item = await inventoryService.updateStockAmount(req.venueId, req.params.id, req.body);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/logs', authenticate, authorize(['ADMIN', 'OWNER']), async (req, res) => {
  try {
    const logs = await inventoryService.getInventoryLogs(req.venueId);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/alerts', authenticate, authorize(['ADMIN', 'OWNER']), async (req, res) => {
  try {
    const alerts = await inventoryService.getCriticalAlerts(req.venueId);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
