// apps/server/src/services/inventoryService.js
import prisma from '../lib/prisma.js';

export const getAllStock = async (venueId) => {
  const stock = await prisma.stockItem.findMany({
    where: { venueId },
    orderBy: { name: 'asc' },
    include: { logs: { take: 20, orderBy: { timestamp: 'desc' } } }
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const usageStats = await prisma.inventoryLog.groupBy({
    by: ['stockItemId'],
    where: {
      venueId,
      change: { lt: 0 },
      timestamp: { gte: sevenDaysAgo }
    },
    _sum: { change: true }
  });

  const usageMap = usageStats.reduce((acc, stat) => {
    acc[stat.stockItemId] = Math.abs(stat._sum.change || 0);
    return acc;
  }, {});

  const enrichedStock = stock.map((item) => {
    const totalUsed = usageMap[item.id] || 0;
    const avgDailyUsage = totalUsed / 7;

    let projectedDays = null;
    if (avgDailyUsage > 0) {
      projectedDays = Math.round(item.amount / avgDailyUsage);
    }

    return {
      ...item,
      projectedDays,
      avgDailyUsage
    };
  });

  return enrichedStock;
};

export const updateStockAmount = async (venueId, id, data) => {
  const { amount, reason } = data;
  
  const current = await prisma.stockItem.findUnique({ 
    where: { 
      id,
      venueId
    } 
  });
  const diff = amount - current.amount;

  const updated = await prisma.stockItem.update({
    where: { id },
    data: { amount }
  });

  await prisma.inventoryLog.create({
    data: {
      venueId,
      stockItemId: id,
      change: diff,
      reason: reason || 'Manual adjustment'
    }
  });

  return updated;
};

export const createStockItem = async (venueId, data) => {
  const item = await prisma.stockItem.create({ 
    data: {
      ...data,
      venueId
    } 
  });
  
  await prisma.inventoryLog.create({
    data: {
      venueId,
      stockItemId: item.id,
      change: item.amount,
      reason: 'Initial registration'
    }
  });

  return item;
};

export const getInventoryLogs = async (venueId) => {
  return await prisma.inventoryLog.findMany({
    where: { venueId },
    include: { stockItem: { select: { name: true, unit: true } } },
    orderBy: { timestamp: 'desc' },
    take: 100
  });
};

export const getCriticalAlerts = async (venueId) => {
  const stock = await getAllStock(venueId);
  return stock
    .filter(item => item.projectedDays !== null && item.projectedDays <= 3)
    .sort((a, b) => a.projectedDays - b.projectedDays)
    .map(item => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      projectedDays: item.projectedDays,
      avgDailyUsage: item.avgDailyUsage
    }));
};
