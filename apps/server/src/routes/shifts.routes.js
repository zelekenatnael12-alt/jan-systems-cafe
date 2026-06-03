import express from 'express';
import * as shiftService from '../services/shiftService.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/open', authenticate, authorize(['ADMIN', 'OWNER']), async (req, res) => {
  const { name, openedBy } = req.body;
  try {
    const shift = await shiftService.openShift(req.venueId, name, openedBy);
    res.json(shift);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/current', authenticate, authorize(['ADMIN', 'OWNER', 'STAFF']), async (req, res) => {
  try {
    const shift = await shiftService.getCurrentShift(req.venueId);
    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/close', authenticate, authorize(['ADMIN', 'OWNER']), async (req, res) => {
  const { shiftId, physicalCash, closedBy, notes } = req.body;
  try {
    const shift = await shiftService.closeShift(req.venueId, shiftId, physicalCash, closedBy, notes);
    res.json(shift);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/report', authenticate, authorize(['ADMIN', 'OWNER']), async (req, res) => {
  const { id } = req.params;
  try {
    const report = await shiftService.getShiftReport(req.venueId, id);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
