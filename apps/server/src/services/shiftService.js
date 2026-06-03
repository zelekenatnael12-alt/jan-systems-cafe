// apps/server/src/services/shiftService.js
import prisma from '../lib/prisma.js';

export const openShift = async (venueId, name, openedBy) => {
  return await prisma.$transaction(async (tx) => {
    const openShift = await tx.shift.findFirst({
      where: { 
        venueId,
        status: 'OPEN' 
      }
    });

    if (openShift) throw new Error('A shift is already open. Please close it first.');

    return await tx.shift.create({
      data: {
        venueId,
        name,
        openedBy,
        status: 'OPEN'
      }
    });
  });
};

export const getCurrentShift = async (venueId) => {
  const shift = await prisma.shift.findFirst({
    where: { 
      venueId,
      status: 'OPEN' 
    },
    include: {
      orders: {
        where: { status: 'DONE' },
        include: { payments: true }
      }
    }
  });

  if (!shift) return null;

  const totalRevenue = shift.orders.reduce((sum, order) => sum + order.total, 0);
  const orderCount = shift.orders.length;

  return {
    ...shift,
    summary: {
      totalRevenue,
      orderCount
    }
  };
};

export const closeShift = async (venueId, shiftId, physicalCash, closedBy, notes) => {
  return await prisma.$transaction(async (tx) => {
    const shift = await tx.shift.findUnique({
      where: { 
        id: shiftId,
        venueId
      },
      include: {
        orders: {
          where: { status: 'DONE' },
          include: { payments: true }
        }
      }
    });

    if (!shift) throw new Error('Shift not found.');
    if (shift.status === 'CLOSED') throw new Error('Shift is already closed.');

    // Calculate system cash (sum of all CASH payments in this shift)
    let systemCash = 0;
    shift.orders.forEach(order => {
      order.payments.forEach(payment => {
        if (payment.method === 'CASH') {
          systemCash += payment.amount;
        }
      });
    });

    const cashVariance = physicalCash - systemCash;

    return await tx.shift.update({
      where: { id: shiftId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedBy,
        systemCash,
        physicalCash,
        cashVariance,
        notes
      }
    });
  });
};

export const getShiftReport = async (venueId, shiftId) => {
  const shift = await prisma.shift.findUnique({
    where: { 
      id: shiftId,
      venueId
    },
    include: {
      orders: {
        where: { status: 'DONE' },
        include: { 
          items: { include: { product: true } },
          payments: true 
        }
      }
    }
  });

  if (!shift) return null;

  // Revenue by method
  const revenueByMethod = {};
  const itemSales = {};
  let totalRevenue = 0;

  shift.orders.forEach(order => {
    totalRevenue += order.total;
    
    order.payments.forEach(p => {
      revenueByMethod[p.method] = (revenueByMethod[p.method] || 0) + p.amount;
    });

    order.items.forEach(item => {
      const pid = item.product.id;
      if (!itemSales[pid]) {
        itemSales[pid] = { 
          name: item.product.name, 
          quantity: 0, 
          revenue: 0,
          icon: item.product.icon
        };
      }
      itemSales[pid].quantity += item.quantity;
      itemSales[pid].revenue += item.quantity * item.product.price;
    });
  });

  const topItems = Object.values(itemSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    shift,
    totalRevenue,
    revenueByMethod,
    topItems,
    orderCount: shift.orders.length,
    averageOrderValue: shift.orders.length > 0 ? totalRevenue / shift.orders.length : 0
  };
};

export const getDayReport = async (venueId, dateStr) => {
  const startOfDay = new Date(dateStr);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(dateStr);
  endOfDay.setHours(23, 59, 59, 999);

  const shifts = await prisma.shift.findMany({
    where: {
      venueId,
      openedAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: {
      orders: {
        where: { status: 'DONE' },
        include: { payments: true }
      }
    }
  });

  let totalRevenue = 0;
  const revenueByMethod = {};
  let totalVariance = 0;
  let totalOrders = 0;

  shifts.forEach(s => {
    totalVariance += (s.cashVariance || 0);
    s.orders.forEach(o => {
      totalRevenue += o.total;
      totalOrders++;
      o.payments.forEach(p => {
        revenueByMethod[p.method] = (revenueByMethod[p.method] || 0) + p.amount;
      });
    });
  });

  return {
    date: dateStr,
    shiftCount: shifts.length,
    totalRevenue,
    totalOrders,
    revenueByMethod,
    totalVariance,
    shifts: shifts.map(s => ({ id: s.id, name: s.name, status: s.status, revenue: s.orders.reduce((sum, o) => sum + o.total, 0) }))
  };
};
