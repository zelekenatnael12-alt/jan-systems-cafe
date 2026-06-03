// apps/server/prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedDemoData(tx = prisma) {
  console.log('Seeding Multi-Tenant Demo Data (Demo Cafe)...');

  // 0. Create Venue
  const venue = await tx.venue.upsert({
    where: { slug: 'demo-cafe' },
    update: {},
    create: {
      name: 'Demo Cafe (የሙከራ ካፌ)',
      slug: 'demo-cafe',
      subscription: 'PRO'
    }
  });

  const venueId = venue.id;

  // 1. Create Stock Items (Ingredients)
  const stockItems = [
    { name: 'Coffee Beans (ቡና ጥሬ)', amount: 50, unit: 'kg', threshold: 5, costPerUnit: 450, venueId },
    { name: 'Milk (ወተት)', amount: 100, unit: 'L', threshold: 10, costPerUnit: 60, venueId },
    { name: 'Honey (ማር)', amount: 30, unit: 'L', threshold: 5, costPerUnit: 800, venueId },
    { name: 'Tea Leaves (ሻይ ቅጠል)', amount: 10, unit: 'kg', threshold: 1, costPerUnit: 300, venueId },
    { name: 'Flour (ዱቄት)', amount: 100, unit: 'kg', threshold: 10, costPerUnit: 120, venueId },
    { name: 'Beef (የበሬ ስጋ)', amount: 40, unit: 'kg', threshold: 5, costPerUnit: 900, venueId },
    { name: 'Mango (ማንጎ)', amount: 50, unit: 'kg', threshold: 5, costPerUnit: 80, venueId },
    { name: 'Avocado (አቮካዶ)', amount: 50, unit: 'kg', threshold: 5, costPerUnit: 70, venueId },
    { name: 'Butter (ቅቤ)', amount: 20, unit: 'kg', threshold: 3, costPerUnit: 1200, venueId },
    { name: 'Berbere (በርበሬ)', amount: 15, unit: 'kg', threshold: 2, costPerUnit: 600, venueId },
    { name: 'Cooking Oil (ዘይት)', amount: 40, unit: 'L', threshold: 5, costPerUnit: 250, venueId },
    { name: 'Sugar (ስኳር)', amount: 50, unit: 'kg', threshold: 5, costPerUnit: 100, venueId }
  ];

  const createdStock = {};
  for (const item of stockItems) {
    createdStock[item.name] = await tx.stockItem.upsert({
      where: { venueId_name: { venueId, name: item.name } },
      update: { amount: item.amount },
      create: item
    });
  }

  // 2. Create Products & Ingredients
  const demoProducts = [
    { name: 'Macchiato (ማኪያቶ)', price: 45, category: 'Coffee', icon: '☕', ingredients: [{ name: 'Coffee Beans (ቡና ጥሬ)', quantity: 0.018 }, { name: 'Milk (ወተት)', quantity: 0.05 }] },
    { name: 'Buna (ጥቁር ቡና)', price: 30, category: 'Coffee', icon: '☕', ingredients: [{ name: 'Coffee Beans (ቡና ጥሬ)', quantity: 0.015 }] },
    { name: 'Milk Tea (ሻይ በወተት)', price: 40, category: 'Tea', icon: '🍵', ingredients: [{ name: 'Tea Leaves (ሻይ ቅጠል)', quantity: 0.005 }, { name: 'Milk (ወተት)', quantity: 0.1 }] },
    { name: 'Tej (ጠጅ)', price: 80, category: 'Traditional', icon: '🍷', ingredients: [{ name: 'Honey (ማር)', quantity: 0.25 }] },
    { name: 'Habesha Tej (ሀበሻ ጠጅ)', price: 120, category: 'Traditional', icon: '🍷', ingredients: [{ name: 'Honey (ማር)', quantity: 0.3 }] },
    { name: 'Spris (ስፕሪስ)', price: 70, category: 'Juice', icon: '🍹', ingredients: [{ name: 'Mango (ማንጎ)', quantity: 0.2 }, { name: 'Avocado (አቮካዶ)', quantity: 0.2 }] },
    { name: 'Avocado Juice (አቮካዶ ጭማቂ)', price: 65, category: 'Juice', icon: '🥑', ingredients: [{ name: 'Avocado (አቮካዶ)', quantity: 0.4 }] },
    { name: 'Mango Juice (ማንጎ ጭማቂ)', price: 65, category: 'Juice', icon: '🥭', ingredients: [{ name: 'Mango (ማንጎ)', quantity: 0.4 }] },
    { name: 'Beef Tibs (የበሬ ጥብስ)', price: 350, category: 'Food', icon: '🍖', ingredients: [{ name: 'Beef (የበሬ ስጋ)', quantity: 0.3 }, { name: 'Butter (ቅቤ)', quantity: 0.05 }, { name: 'Cooking Oil (ዘይት)', quantity: 0.02 }] },
    { name: 'Firfir (ፍርፍር)', price: 200, category: 'Food', icon: '🥘', ingredients: [{ name: 'Berbere (በርበሬ)', quantity: 0.05 }, { name: 'Butter (ቅቤ)', quantity: 0.03 }, { name: 'Cooking Oil (ዘይት)', quantity: 0.02 }] },
    { name: 'Injera with Wot (እንጀራ በወጥ)', price: 250, category: 'Food', icon: '🥙', ingredients: [{ name: 'Beef (የበሬ ስጋ)', quantity: 0.2 }, { name: 'Berbere (በርበሬ)', quantity: 0.05 }] },
    { name: 'Shiro (ሽሮ)', price: 150, category: 'Food', icon: '🍲', ingredients: [{ name: 'Berbere (በርበሬ)', quantity: 0.04 }, { name: 'Cooking Oil (ዘይት)', quantity: 0.05 }] },
    { name: 'Sambusa (ሳምቡሳ)', price: 25, category: 'Snacks', icon: '🥟', ingredients: [{ name: 'Flour (ዱቄት)', quantity: 0.1 }, { name: 'Cooking Oil (ዘይት)', quantity: 0.02 }] },
    { name: 'Mandazi (ማንዳዚ)', price: 20, category: 'Snacks', icon: '🥖', ingredients: [{ name: 'Flour (ዱቄት)', quantity: 0.15 }, { name: 'Sugar (ስኳር)', quantity: 0.02 }] },
    { name: 'Croissant (ክሮይሰንት)', price: 60, category: 'Snacks', icon: '🥐', ingredients: [{ name: 'Flour (ዱቄት)', quantity: 0.2 }] }
  ];

  for (const prod of demoProducts) {
    const { ingredients: linkedIngredients, ...prodData } = prod;
    await tx.product.upsert({
      where: { venueId_name: { venueId, name: prod.name } },
      update: { price: prod.price, category: prod.category },
      create: {
        ...prodData,
        venueId,
        ingredients: {
          create: linkedIngredients.map(ing => ({
            quantity: ing.quantity,
            stockItemId: createdStock[ing.name].id
          }))
        }
      }
    });
  }

  // 3. Create Tables
  const zones = ['MAIN', 'BALCONY', 'VIP'];
  for (let i = 1; i <= 15; i++) {
    await tx.table.upsert({
      where: { venueId_number: { venueId, number: i } },
      update: {},
      create: {
        number: i,
        zone: zones[Math.floor((i-1)/5)],
        seats: Math.floor(Math.random() * 4) + 2,
        venueId
      }
    });
  }

  // 4. Create Users
  const password = await bcrypt.hash('password123', 10);
  const roles = ['OWNER', 'ADMIN', 'STAFF'];
  for (const role of roles) {
    await tx.user.upsert({
      where: { email: `${role.toLowerCase()}@jan.com` },
      update: { venueId },
      create: {
        email: `${role.toLowerCase()}@jan.com`,
        password,
        name: `Demo ${role}`,
        role,
        venueId
      }
    });
  }

  // 5. Create Config
  await tx.cafeConfig.upsert({
    where: { venueId },
    update: {},
    create: {
      cafeName: 'Demo Cafe (የሙከራ ካፌ)',
      currencySymbol: 'ብር',
      primaryColor: '#D49E4A',
      secondaryColor: '#1C1209',
      receiptHeader: 'Thank you for visiting!',
      venueId
    }
  });

  // 6. Create Settings
  const defaultSettings = [
    { key: 'VAT_RATE', value: '15' },
    { key: 'SERVICE_CHARGE', value: '10' },
    { key: 'PRINT_RECEIPT', value: 'true' }
  ];
  for (const setting of defaultSettings) {
    await tx.settings.upsert({
      where: { venueId_key: { venueId, key: setting.key } },
      update: { value: setting.value },
      create: { ...setting, venueId }
    });
  }

  // 7. Create Sample Orders (so the demo has revenue data)
  const products = await tx.product.findMany({ where: { venueId }, take: 5 });
  const tables = await tx.table.findMany({ where: { venueId }, take: 3 });
  const existingOrders = await tx.order.count({ where: { venueId } });

  if (existingOrders === 0 && products.length > 0) {
    const paymentMethods = ['CASH', 'TELEBIRR', 'CBE_BIRR', 'CASH', 'CASH'];
    for (let i = 0; i < 8; i++) {
      const orderProducts = products.slice(0, Math.floor(Math.random() * 3) + 1);
      const total = orderProducts.reduce((s, p) => s + p.price * (Math.floor(Math.random() * 2) + 1), 0);
      const method = paymentMethods[i % paymentMethods.length];
      const createdAt = new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000); // last 6 hours

      const order = await tx.order.create({
        data: {
          venueId,
          status: 'DONE',
          total,
          paymentMethod: method,
          tableId: tables[i % tables.length]?.id || null,
          createdAt,
          items: {
            create: orderProducts.map(p => ({
              productId: p.id,
              quantity: Math.floor(Math.random() * 2) + 1,
            }))
          }
        }
      });

      // Create matching payment
      await tx.payment.create({
        data: {
          venueId,
          orderId: order.id,
          amount: total,
          method,
          paidAt: createdAt,
        }
      });
    }
    console.log('  ↳ Created 8 sample orders with payments');
  }

  console.log('Seeding complete! 🌱');
  return venue;
}

async function main() {
  console.log('Running standard seed...');
  
  // Create Superadmin
  const superadminPassword = await bcrypt.hash('janinstaller2026', 10);
  await prisma.user.upsert({
    where: { email: 'installer@jansystems.com' },
    update: {},
    create: {
      email: 'installer@jansystems.com',
      password: superadminPassword,
      name: 'Jan Systems Installer',
      role: 'SUPERADMIN'
    }
  });

  await seedDemoData();
  console.log('Standard seed complete.');
}

if (process.argv[1].endsWith('seed.js')) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
