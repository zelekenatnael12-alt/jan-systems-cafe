// apps/server/src/services/paymentService.js
import prisma from '../lib/prisma.js';

export const addPayment = async (venueId, data) => {
  const { orderId, amount, method, note, reference } = data;

  return await prisma.$transaction(async (tx) => {
    // 1. Create payment entry
    const payment = await tx.payment.create({
      data: {
        venueId,
        orderId,
        amount,
        method,
        note,
        reference: reference || null
      }
    });

    // 2. Calculate total paid for this order
    const allPayments = await tx.payment.findMany({
      where: { 
        orderId,
        venueId
      }
    });

    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    // 3. Optional: Trigger some logic if fully paid? 
    // The user said "Confirms only when fully settled".
    // We'll leave the order status update to the explicit updateStatus call for now,
    // but we can return the remaining balance.

    const order = await tx.order.findUnique({
      where: { 
        id: orderId,
        venueId
      }
    });

    return {
      payment,
      remaining: order.total - totalPaid,
      isFullyPaid: totalPaid >= order.total
    };
  });
};

export const getPaymentsByOrder = async (venueId, orderId) => {
  return await prisma.payment.findMany({
    where: { 
      orderId,
      venueId
    },
    orderBy: { paidAt: 'desc' }
  });
};
