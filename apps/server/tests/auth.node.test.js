import 'dotenv/config';
import { test } from 'vitest';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jan_secret_key_2026_luxury_suite';

test('Auth: Token should contain venueId', async () => {
  const payload = {
    id: 'user-123',
    role: 'OWNER',
    venueId: 'venue-abc'
  };

  const token = jwt.sign(payload, JWT_SECRET);
  const decoded = jwt.verify(token, JWT_SECRET);

  assert.strictEqual(decoded.venueId, 'venue-abc');
  assert.strictEqual(decoded.role, 'OWNER');
  console.log('✅ Auth token test passed!');
});

test('Auth: Token without venueId should fail for non-superadmin', async () => {
  const payload = { id: 'user-123', role: 'OWNER' };
  const token = jwt.sign(payload, JWT_SECRET);
  const decoded = jwt.verify(token, JWT_SECRET);
  
  // Simulation of middleware logic
  const isAuthorized = decoded.venueId || decoded.role === 'SUPERADMIN';
  assert.strictEqual(!!isAuthorized, false, 'Should be unauthorized without venueId');
  console.log('✅ Auth missing venueId guard test passed!');
});
