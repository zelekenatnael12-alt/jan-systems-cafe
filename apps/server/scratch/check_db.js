import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  console.log('--- DIAGNOSTIC CHECK ---');
  try {
    const venues = await prisma.venue.findMany();
    console.log(`Venues found: ${venues.length}`);
    venues.forEach(v => console.log(`  - ID: ${v.id}, Name: ${v.name}, Slug: ${v.slug}`));

    const users = await prisma.user.findMany();
    console.log(`Users found: ${users.length}`);
    users.forEach(u => console.log(`  - Email: ${u.email}, Role: ${u.role}, VenueID: ${u.venueId}`));

    const configs = await prisma.cafeConfig.findMany();
    console.log(`CafeConfigs found: ${configs.length}`);
    configs.forEach(c => console.log(`  - VenueID: ${c.venueId}, CafeName: ${c.cafeName}`));

    const tables = await prisma.table.findMany();
    console.log(`Tables found: ${tables.length}`);

    const products = await prisma.product.findMany();
    console.log(`Products found: ${products.length}`);
  } catch (error) {
    console.error('Prisma query failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
