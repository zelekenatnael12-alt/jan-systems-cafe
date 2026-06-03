// apps/server/src/routes/auth.routes.js
import express from 'express';
import { z } from 'zod';
import * as authService from '../services/authService.js';
import * as saasService from '../services/saasService.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const refreshSchema = z.object({
  refreshToken: z.string()
});

const registerSaasSchema = z.object({
  venueName: z.string().min(2, 'Cafe name must be at least 2 characters'),
  venueSlug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and dashes only'),
  ownerName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  plan: z.enum(['TRIAL', 'BASIC', 'PRO', 'ENTERPRISE']).optional().default('TRIAL'),
});

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.post('/register-saas', validate(registerSaasSchema), async (req, res) => {
  try {
    const result = await saasService.registerVenue(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/refresh', validate(refreshSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.post('/logout', authenticate, async (req, res) => {
  try {
    await authService.logout(req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
