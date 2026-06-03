import prisma from '../lib/prisma.js';

export async function checkExpiredSubscriptions() {
  console.log('Running daily subscription expiry check...');
  
  const now = new Date();
  
  // Find all TRIAL or active venues where expiry date has passed
  const expiredVenues = await prisma.venue.findMany({
    where: {
      subscription: { in: ['TRIAL', 'BASIC', 'PRO'] },
      subscriptionExpiresAt: { lt: now }
    }
  });

  for (const venue of expiredVenues) {
    console.log(`Venue ${venue.name} (${venue.id}) has expired. Updating status to CANCELLED.`);
    await prisma.venue.update({
      where: { id: venue.id },
      data: { subscription: 'CANCELLED' }
    });
    
    // TODO: Send "Subscription Expired" email via Resend
  }
}
