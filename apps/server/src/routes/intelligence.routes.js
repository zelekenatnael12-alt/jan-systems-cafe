import express from 'express';
import * as intelligenceService from '../services/intelligenceService.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/calibrate', authenticate, authorize(['ADMIN', 'OWNER']), async (req, res) => {
  try {
    const suggestions = await intelligenceService.getSuggestedCalibrations(req.venueId);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
