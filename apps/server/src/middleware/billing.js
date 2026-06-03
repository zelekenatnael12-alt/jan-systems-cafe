import prisma from '../lib/prisma.js';

export async function checkSubscription(req, res, next) {
  const venueId = req.venueId;
  if (!venueId) return next();

  try {
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { subscription: true, subscriptionExpiresAt: true }
    });

    if (!venue) return res.status(404).json({ error: 'Venue not found' });

    // 1. Check if cancelled
    if (venue.subscription === 'CANCELLED') {
      return res.status(402).json({ 
        error: 'Subscription inactive', 
        code: 'SUBSCRIPTION_REQUIRED' 
      });
    }

    // 2. Check trial expiry
    if (venue.subscription === 'TRIAL' && venue.subscriptionExpiresAt) {
      if (new Date() > venue.subscriptionExpiresAt) {
        return res.status(402).json({ 
          error: 'Trial expired', 
          code: 'TRIAL_EXPIRED' 
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Subscription check failed' });
  }
}
