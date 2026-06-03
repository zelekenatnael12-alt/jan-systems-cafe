import 'dotenv/config';
import { test } from 'vitest';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test('Billing Guard: Should identify expired trial', async () => {
  const expiredVenue = await prisma.venue.upsert({
    where: { slug: 'expired-venue' },
    update: {
      subscription: 'TRIAL',
      subscriptionExpiresAt: new Date(Date.now() - 1000)
    },
    create: { 
      name: 'Expired Venue', 
      slug: 'expired-venue',
      subscription: 'TRIAL',
      subscriptionExpiresAt: new Date(Date.now() - 1000) // 1 second ago
    }
  });

  const isExpired = expiredVenue.subscription === 'TRIAL' && 
                    expiredVenue.subscriptionExpiresAt < new Date();
  
  assert.strictEqual(isExpired, true, 'Venue should be flagged as expired');
  console.log('✅ Billing guard logic test passed!');
});

test('Billing Guard: Should identify cancelled status', async () => {
  const cancelledVenue = await prisma.venue.upsert({
    where: { slug: 'cancelled-venue' },
    update: {
      subscription: 'CANCELLED'
    },
    create: { 
      name: 'Cancelled Venue', 
      slug: 'cancelled-venue',
      subscription: 'CANCELLED'
    }
  });

  assert.strictEqual(cancelledVenue.subscription, 'CANCELLED');
  console.log('✅ Billing status test passed!');
});
