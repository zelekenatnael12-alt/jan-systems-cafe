// apps/server/src/services/saasService.js
// Self-Service SaaS Registration — called by /api/auth/register-saas
// Uses venueService.provisionVenue() internally for DRY provisioning,
// then returns a JWT so the frontend can auto-login immediately.
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import stripe from '../lib/stripe.js';
import resend from '../lib/resend.js';
import { provisionVenue } from './venueService.js';

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'jan_refresh_secret';

export async function registerVenue(data) {
  const { venueName, venueSlug, ownerName, email, password, plan = 'TRIAL' } = data;

  // 1. Validate required fields
  if (!venueName || !venueSlug || !ownerName || !email || !password) {
    throw new Error('All fields are required: venueName, venueSlug, ownerName, email, password');
  }

  // 2. Check if email is already taken
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('Email already registered');

  // 3. Provision venue + config + owner via venueService (atomic transaction)
  const result = await provisionVenue({
    venueName,
    slug: venueSlug,
    plan,
    ownerName,
    ownerEmail: email,
    ownerPassword: password,
  });

  // 4. Generate JWT tokens for auto-login
  const user = await prisma.user.findUnique({ where: { email } });
  const { accessToken, refreshToken } = generateTokens(user);

  // Store refresh token
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken }
  });

  // 5. Create Stripe Customer (non-blocking, only if Stripe is live)
  let checkoutUrl = null;
  if (!stripe._isMock) {
    try {
      const customer = await stripe.customers.create({
        email,
        name: ownerName,
        metadata: { venueId: result.venue.id }
      });

      await prisma.venue.update({
        where: { id: result.venue.id },
        data: { stripeCustomerId: customer.id }
      });

      // If not TRIAL, create a checkout session for paid plan
      if (plan !== 'TRIAL') {
        const priceMap = {
          'BASIC': process.env.STRIPE_PRICE_BASIC,
          'PRO': process.env.STRIPE_PRICE_PRO,
          'ENTERPRISE': process.env.STRIPE_PRICE_ENTERPRISE,
        };

        if (priceMap[plan]) {
          const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            payment_method_types: ['card'],
            line_items: [{ price: priceMap[plan], quantity: 1 }],
            mode: 'subscription',
            metadata: { venueId: result.venue.id, plan },
            success_url: `${process.env.CLIENT_URL}/admin?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/register`,
          });
          checkoutUrl = session.url;
        }
      }
    } catch (stripeErr) {
      console.error('[Stripe] Customer creation failed (non-fatal):', stripeErr.message);
    }
  }

  // 6. Send Welcome Email (non-blocking)
  try {
    await resend.emails.send({
      from: 'Jan Systems <onboarding@jansystems.com>',
      to: email,
      subject: `Welcome to ${venueName}!`,
      html: `
        <div style="font-family: serif; color: #120B05; padding: 40px; background: #FAF9F6;">
          <h1 style="font-size: 32px; font-weight: 900; margin-bottom: 20px;">Welcome to the Future of Hospitality.</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #444;">Hi ${ownerName},</p>
          <p style="font-size: 16px; line-height: 1.6; color: #444;">Your venue, <strong>${venueName}</strong>, has been successfully created on Jan Systems. You can now start managing your orders, inventory, and staff.</p>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="display: inline-block; background: #D49E4A; color: white; padding: 15px 30px; border-radius: 50px; text-decoration: none; font-weight: bold; margin-top: 20px; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Enter Your Dashboard</a>
          <p style="margin-top: 40px; font-size: 12px; opacity: 0.5;">© 2026 Jan Systems. All rights reserved.</p>
        </div>
      `
    });
  } catch (emailError) {
    console.error('[Resend] Welcome email failed (non-fatal):', emailError.message);
  }

  // 7. Return token + venue info for auto-login
  return {
    token: accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role, name: user.name, venueId: user.venueId },
    venue: result.venue,
    checkoutUrl,
  };
}

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, venueId: user.venueId },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}
