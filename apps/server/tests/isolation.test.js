import 'dotenv/config';
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Multi-Tenant Data Isolation', () => {
  let venueA, venueB;

  beforeAll(async () => {
    // 1. Create two distinct venues
    venueA = await prisma.venue.upsert({
      where: { slug: 'venue-a' },
      update: {},
      create: { name: 'Venue A', slug: 'venue-a' }
    });

    venueB = await prisma.venue.upsert({
      where: { slug: 'venue-b' },
      update: {},
      create: { name: 'Venue B', slug: 'venue-b' }
    });

    // 2. Create a product in Venue A
    await prisma.product.upsert({
      where: { venueId_name: { venueId: venueA.id, name: 'Secret Pizza' } },
      update: {},
      create: {
        name: 'Secret Pizza',
        price: 100,
        category: 'Food',
        icon: '🍕',
        venueId: venueA.id
      }
    });
  });

  it('should NOT leak products from Venue A to Venue B', async () => {
    const res = await request(app)
      .get('/api/menu')
      .set('x-venue-id', venueB.id);

    expect(res.status).toBe(200);
    const menu = res.body;
    const pizza = menu.find(p => p.name === 'Secret Pizza');
    expect(pizza).toBeUndefined();
  });

  it('should ONLY show Venue A products for Venue A', async () => {
    const res = await request(app)
      .get('/api/menu')
      .set('x-venue-id', venueA.id);

    expect(res.status).toBe(200);
    const menu = res.body;
    const pizza = menu.find(p => p.name === 'Secret Pizza');
    expect(pizza).toBeDefined();
    expect(pizza.venueId).toBe(venueA.id);
  });
});
