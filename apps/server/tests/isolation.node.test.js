import 'dotenv/config';
import { test } from 'vitest';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import * as menuService from '../src/services/menuService.js';

const prisma = new PrismaClient();

test('Multi-Tenant Data Isolation (Service Level)', async () => {
  // 1. Setup
  const venueA = await prisma.venue.upsert({
    where: { slug: 'venue-a' },
    update: { name: 'Venue A' },
    create: { name: 'Venue A', slug: 'venue-a' }
  });

  const venueB = await prisma.venue.upsert({
    where: { slug: 'venue-b' },
    update: { name: 'Venue B' },
    create: { name: 'Venue B', slug: 'venue-b' }
  });

  const secretName = `Secret Pizza ${Date.now()}`;
  await prisma.product.create({
    data: {
      name: secretName,
      price: 100,
      category: 'Food',
      icon: '🍕',
      venueId: venueA.id
    }
  });

  // 2. Execution & Assertion
  const menuB = await menuService.getAllProducts(venueB.id);
  const foundInB = menuB.find(p => p.name === secretName);
  assert.strictEqual(foundInB, undefined, 'Venue A data should NOT be in Venue B');

  const menuA = await menuService.getAllProducts(venueA.id);
  const foundInA = menuA.find(p => p.name === secretName);
  assert.ok(foundInA, 'Venue A data should be in Venue A');
  assert.strictEqual(foundInA.venueId, venueA.id);

  console.log('✅ Isolation test passed!');
});
