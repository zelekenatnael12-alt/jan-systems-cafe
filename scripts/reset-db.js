/**
 * Jan Systems — Database Reset Script
 * 
 * Wipes all transactional data (orders, payments, shifts, inventory logs,
 * test users) and re-seeds clean demo data for a fresh cafe environment.
 * 
 * Usage:  node scripts/reset-db.js
 * 
 * ⚠️  WARNING: This permanently deletes all orders, payments, and shifts.
 *              Only run before a new client demo or fresh installation.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Load env from server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../apps/server/.env') });

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('\n🔴  Jan Systems — Database Reset');
  console.log('================================');
  console.log('⚠️   This will DELETE all orders, payments, shifts, and test users.\n');

  // ── PHASE 1: WIPE TRANSACTIONAL DATA ──────────────────────────────────────
  console.log('📦  Phase 1: Clearing transactional data...');

  // Delete in correct dependency order (children before parents)
  await prisma.inventoryLog.deleteMany({});
  console.log('   ✓  Inventory logs cleared');

  await prisma.payment.deleteMany({});
  console.log('   ✓  Payments cleared');

  await prisma.orderItem.deleteMany({});
  console.log('   ✓  Order items cleared');

  await prisma.order.deleteMany({});
  console.log('   ✓  Orders cleared');

  await prisma.shift.deleteMany({});
  console.log('   ✓  Shifts cleared');

  await prisma.schedule.deleteMany({});
  console.log('   ✓  Schedules cleared');

  // ── PHASE 2: REMOVE TEST/DEV USERS ────────────────────────────────────────
  console.log('\n👤  Phase 2: Removing test accounts...');
  
  // Remove any email that looks like a test account
  const testEmailPatterns = [
    'test@', 'test2@', 'dev@', 'debug@', 'fake@', 'demo@gmail', 'temp@'
  ];

  const allUsers = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  const testUsers = allUsers.filter(u => 
    testEmailPatterns.some(pattern => u.email.toLowerCase().includes(pattern))
  );

  if (testUsers.length > 0) {
    for (const u of testUsers) {
      await prisma.user.delete({ where: { id: u.id } });
      console.log(`   ✓  Removed test user: ${u.email}`);
    }
  } else {
    console.log('   ✓  No test accounts found');
  }

  // ── PHASE 3: RESET TABLE STATUS ───────────────────────────────────────────
  console.log('\n🪑  Phase 3: Resetting table status...');
  await prisma.table.updateMany({
    data: { status: 'AVAILABLE' }
  });
  console.log('   ✓  All tables set to AVAILABLE');

  // ── PHASE 4: RESTORE STOCK TO DEMO LEVELS ─────────────────────────────────
  console.log('\n📦  Phase 4: Restoring stock levels...');

  const stockLevels = {
    'Coffee Beans (ቡና ጥሬ)': 50,
    'Milk (ወተት)': 100,
    'Honey (ማር)': 30,
    'Tea Leaves (ሻይ ቅጠል)': 10,
    'Flour (ዱቄት)': 100,
    'Beef (የበሬ ስጋ)': 40,
    'Mango (ማንጎ)': 50,
    'Avocado (አቮካዶ)': 50,
    'Butter (ቅቤ)': 20,
    'Berbere (በርበሬ)': 15,
    'Cooking Oil (ዘይት)': 40,
    'Sugar (ስኳር)': 50,
  };

  for (const [name, amount] of Object.entries(stockLevels)) {
    try {
      await prisma.stockItem.update({
        where: { name },
        data: { amount }
      });
      console.log(`   ✓  ${name}: ${amount} units restored`);
    } catch {
      console.log(`   ⚠️  Stock item not found (skipped): ${name}`);
    }
  }

  // ── PHASE 5: ENSURE SEED ACCOUNTS EXIST ──────────────────────────────────
  console.log('\n🔑  Phase 5: Ensuring system accounts exist...');

  const superadminPassword = await bcrypt.hash(
    process.env.SUPERADMIN_PASSWORD || 'janinstaller2026', 10
  );
  await prisma.user.upsert({
    where: { email: 'installer@jansystems.com' },
    update: { password: superadminPassword },
    create: {
      email: 'installer@jansystems.com',
      password: superadminPassword,
      name: 'Jan Systems Installer',
      role: 'SUPERADMIN'
    }
  });
  console.log('   ✓  SUPERADMIN: installer@jansystems.com');

  // ── PHASE 6: SEED REALISTIC DEMO ORDERS ──────────────────────────────────
  console.log('\n🌱  Phase 6: Seeding realistic demo data...');

  const tables = await prisma.table.findMany({ orderBy: { number: 'asc' } });
  const products = await prisma.product.findMany();

  if (tables.length === 0 || products.length === 0) {
    console.log('   ⚠️  No tables or products found. Run the Setup Wizard first to seed the full menu.');
  } else {
    // Helper to find product
    const find = (keyword) => products.find(p => p.name.toLowerCase().includes(keyword.toLowerCase()));

    // Demo Order 1: Completed — Table 3, Beef Tibs + Macchiato (TELEBIRR)
    const tibs = find('Tibs');
    const mach = find('Macchiato');
    if (tibs && mach && tables[2]) {
      await prisma.order.create({
        data: {
          customer: 'Abebe T.',
          total: tibs.price + mach.price,
          status: 'DONE',
          paymentMethod: 'TELEBIRR',
          tableId: tables[2].id,
          items: {
            create: [
              { productId: tibs.id, quantity: 1 },
              { productId: mach.id, quantity: 1 }
            ]
          },
          payments: {
            create: [{ amount: tibs.price + mach.price, method: 'TELEBIRR', note: 'Demo' }]
          }
        }
      });
      console.log(`   ✓  Demo Order 1: Beef Tibs + Macchiato — DONE (Table 3)`);
    }

    // Demo Order 2: Completed — Table 7, Spris + Injera (CASH)
    const spris = find('Spris');
    const injera = find('Injera');
    if (spris && injera && tables[6]) {
      await prisma.order.create({
        data: {
          customer: 'Tigist M.',
          total: spris.price + injera.price,
          status: 'DONE',
          paymentMethod: 'CASH',
          tableId: tables[6].id,
          items: {
            create: [
              { productId: spris.id, quantity: 1 },
              { productId: injera.id, quantity: 1 }
            ]
          },
          payments: {
            create: [{ amount: spris.price + injera.price, method: 'CASH', note: 'Demo' }]
          }
        }
      });
      console.log(`   ✓  Demo Order 2: Spris + Injera — DONE (Table 7)`);
    }

    // Demo Order 3: Active (NEW) — Table 1, 2x Buna + Sambusa
    const buna = find('Buna');
    const sambusa = find('Sambusa');
    if (buna && sambusa && tables[0]) {
      await prisma.order.create({
        data: {
          customer: 'Dawit K.',
          total: (buna.price * 2) + sambusa.price,
          status: 'NEW',
          tableId: tables[0].id,
          items: {
            create: [
              { productId: buna.id, quantity: 2 },
              { productId: sambusa.id, quantity: 1 }
            ]
          }
        }
      });
      // Mark table as occupied
      await prisma.table.update({ where: { id: tables[0].id }, data: { status: 'OCCUPIED' } });
      console.log(`   ✓  Demo Order 3: 2x Buna + Sambusa — NEW/active (Table 1)`);
    }

    // Demo Order 4: Preparing — Table 5, Shiro + Milk Tea
    const shiro = find('Shiro');
    const milkTea = find('Milk Tea');
    if (shiro && milkTea && tables[4]) {
      await prisma.order.create({
        data: {
          customer: 'Hana B.',
          total: shiro.price + milkTea.price,
          status: 'PREPARING',
          tableId: tables[4].id,
          items: {
            create: [
              { productId: shiro.id, quantity: 1 },
              { productId: milkTea.id, quantity: 1 }
            ]
          }
        }
      });
      await prisma.table.update({ where: { id: tables[4].id }, data: { status: 'OCCUPIED' } });
      console.log(`   ✓  Demo Order 4: Shiro + Milk Tea — PREPARING (Table 5)`);
    }
  }

  // ── DONE ──────────────────────────────────────────────────────────────────
  console.log('\n✅  Database reset complete!');
  console.log('================================');
  console.log('The demo environment now shows:');
  console.log('  • 2 completed orders (DONE) with payment history');
  console.log('  • 1 active order (NEW) at Table 1');
  console.log('  • 1 order being prepared (PREPARING) at Table 5');
  console.log('  • All stock restored to full levels');
  console.log('  • All tables reset (Tables 1 & 5 marked OCCUPIED)');
  console.log('\nLogin: installer@jansystems.com / janinstaller2026\n');
}

resetDatabase()
  .catch((e) => {
    console.error('\n❌  Reset failed:', e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
