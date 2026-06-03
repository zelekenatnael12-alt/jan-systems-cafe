import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import * as ownerService from './services/ownerService.js';
import * as authService from './services/authService.js';
import * as menuService from './services/menuService.js';
import * as orderService from './services/orderService.js';
import * as inventoryService from './services/inventoryService.js';
import * as intelligenceService from './services/intelligenceService.js';
import * as tableService from './services/tableService.js';
import * as paymentService from './services/paymentService.js';
import * as shiftService from './services/shiftService.js';
import * as configService from './services/configService.js';
import * as receiptService from './services/receiptService.js';
import { initiatePayment } from './services/telebirrService.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/orders.routes.js';
import tableRoutes from './routes/tables.routes.js';
import menuRoutes from './routes/menu.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import shiftRoutes from './routes/shifts.routes.js';
import configRoutes from './routes/config.routes.js';
import ownerRoutes from './routes/owner.routes.js';
import intelligenceRoutes from './routes/intelligence.routes.js';
import webhookRoutes from './routes/webhooks.routes.js';
import superadminRoutes from './routes/superadmin.routes.js';
import { checkSubscription } from './middleware/billing.js';
import cron from 'node-cron';
import { checkExpiredSubscriptions } from './cron/expiryCheck.js';
import * as imageService from './services/imageService.js';
import { authenticate, authorize } from './middleware/auth.js';
import { seedDemoData } from '../prisma/seed.js';



const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

// ── WEBHOOKS (MUST BE BEFORE express.json()) ──
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(cors());
app.use(express.json());

import prisma from './lib/prisma.js';

// ── UPLOADS CONFIG ──
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadPath = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Attach io to request + app
app.set('io', io);
app.use((req, res, next) => {
  req.io = io;
  next();
});
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'prod-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG and WebP are allowed'));
  }
});

// ── REAL-TIME EVENTS ──
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// ── API ROUTES ──

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);

// ── PUBLIC ROUTES (no auth required) ──
// Config and menu must be accessible for demo mode, setup wizard, and landing page
app.use('/api/config', configRoutes);
app.use('/api/menu', menuRoutes);

// ── BILLING GUARD (Applied to all subsequent routes) ──
app.use('/api', authenticate, checkSubscription);

app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/superadmin', superadminRoutes);

// ── IMAGE ROUTES ──
app.post('/api/images/upload', authenticate, authorize(['ADMIN', 'OWNER', 'SUPERADMIN']), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) throw new Error('No file uploaded');
    const result = await imageService.uploadImage(req.file);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/images/:filename', authenticate, authorize(['ADMIN', 'OWNER', 'SUPERADMIN']), async (req, res) => {
  try {
    await imageService.deleteImage(req.params.filename);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── RECEIPT ENDPOINTS ──
// Build and return an ERCA-compliant ESC/POS receipt for a completed order.
app.get('/api/orders/:id/receipt', authenticate, async (req, res) => {
  try {
    const receipt = await receiptService.buildReceipt(req.params.id, req.venueId);
    res.json(receipt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Plain-text receipt for SMS/WhatsApp delivery.
app.get('/api/orders/:id/receipt/sms', authenticate, async (req, res) => {
  try {
    const text = await receiptService.buildSmsReceipt(req.params.id, req.venueId);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PAYMENT INITIATE (QR generation) ──
// Cashier calls this to get a QR code URL for mobile money payment.
app.post('/api/payments/initiate', authenticate, async (req, res) => {
  try {
    const { provider, orderId, amount, description } = req.body;
    const result = await initiatePayment(provider, {
      orderId,
      amount,
      venueId: req.venueId,
      description,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SUPERADMIN Setup & Seeding ──
app.post('/api/setup/seed-demo', authenticate, authorize(['SUPERADMIN']), async (req, res) => {
  try {
    res.json({ success: true, message: 'Demo seeding requires venue selection in SaaS mode.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── CRON JOBS ──
cron.schedule('0 0 * * *', () => {
  checkExpiredSubscriptions();
});

// Run once on startup to ensure consistency
checkExpiredSubscriptions();

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Jan Systems Server running on port ${PORT}`);
});

export { app, httpServer };
