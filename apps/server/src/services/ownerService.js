// apps/server/src/services/ownerService.js
import prisma from '../lib/prisma.js';

// ─── Ethiopian Calendar helper (server-side) ──────────────────────────────────
const ET_MONTHS = ['መስከረም','ጥቅምት','ኅዳር','ታኅሣሥ','ጥር','የካቲት','መጋቢት','ሚያዝያ','ጉንቦት','ሰኔ','ሐምሌ','ነሐሴ','ጳጉሜን'];
function toEthiopianMonth(date) {
  const gcYear = date.getFullYear(), gcMonth = date.getMonth() + 1, gcDay = date.getDate();
  const a = Math.floor((14 - gcMonth) / 12);
  const y = gcYear + 4800 - a;
  const m = gcMonth + 12 * a - 3;
  const jdn = gcDay + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) - 32045;
  const r   = (jdn - 1723856) % 1461;
  const n   = r % 365 + 365 * Math.floor(r/1460);
  const etMonth = Math.min(Math.floor(n/30), 12);
  return { month: etMonth + 1, monthName: ET_MONTHS[etMonth] };
}

export const getBriefing = async (venueId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekEnd = new Date(lastWeek);
  lastWeekEnd.setHours(23, 59, 59, 999);

  const todayOrders = await prisma.order.findMany({
    where: { venueId, createdAt: { gte: today }, status: 'DONE' },
    include: { items: true }
  });
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const todayCount   = todayOrders.length;

  const lastWeekOrders = await prisma.order.findMany({
    where: { venueId, createdAt: { gte: lastWeek, lte: lastWeekEnd }, status: 'DONE' }
  });
  const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + o.total, 0);
  let comparison = 0;
  if (lastWeekRevenue > 0) {
    comparison = Math.round(((todayRevenue - lastWeekRevenue) / lastWeekRevenue) * 100);
  }

  const hourlyCounts = {};
  todayOrders.forEach(o => {
    const hour = new Date(o.createdAt).getHours();
    hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
  });
  let busiestHour = null, maxOrders = 0;
  Object.entries(hourlyCounts).forEach(([hour, count]) => {
    if (count > maxOrders) { maxOrders = count; busiestHour = hour; }
  });

  // Top selling item today
  const itemCounts = {};
  todayOrders.forEach(o => {
    o.items?.forEach(i => {
      itemCounts[i.productId] = (itemCounts[i.productId] || 0) + (i.quantity || 1);
    });
  });

  return {
    todayRevenue, todayCount, comparison,
    busiestHour: busiestHour ? `${busiestHour}:00 EAT` : 'N/A',
  };
};

export const getRevenueAnalytics = async (venueId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = await prisma.order.findMany({
    where: { venueId, createdAt: { gte: today }, status: 'DONE' }
  });

  const hourlyRevenue = Array(24).fill(0);
  todayOrders.forEach(o => {
    const hour = new Date(o.createdAt).getHours();
    hourlyRevenue[hour] += o.total;
  });

  const itemRevenue = await prisma.orderItem.findMany({
    where: { order: { venueId, createdAt: { gte: today }, status: 'DONE' } },
    include: { product: true }
  });

  const itemSummary = {};
  itemRevenue.forEach(oi => {
    if (!itemSummary[oi.product.name]) {
      itemSummary[oi.product.name] = { name: oi.product.name, units: 0, revenue: 0 };
    }
    itemSummary[oi.product.name].units   += oi.quantity;
    itemSummary[oi.product.name].revenue += oi.product.price * oi.quantity;
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklyOrders = await prisma.order.findMany({
    where: { venueId, createdAt: { gte: sevenDaysAgo }, status: 'DONE' }
  });

  const weeklyTrend = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    weeklyTrend[d.toLocaleDateString('en-ET')] = 0;
  }
  weeklyOrders.forEach(o => {
    const dateKey = new Date(o.createdAt).toLocaleDateString('en-ET');
    if (weeklyTrend[dateKey] !== undefined) weeklyTrend[dateKey] += o.total;
  });

  return {
    hourlyRevenue,
    itemRevenue: Object.values(itemSummary).sort((a, b) => b.revenue - a.revenue),
    weeklyTrend: Object.entries(weeklyTrend).map(([date, revenue]) => ({ date, revenue }))
  };
};

export const getPaymentBreakdown = async (venueId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const payments = await prisma.payment.findMany({
    where: { venueId, paidAt: { gte: today } }
  });

  const breakdown = { CASH: 0, TELEBIRR: 0, CBE_BIRR: 0, ETHIOPAY: 0, BANK_TRANSFER: 0, OTHER: 0 };
  payments.forEach(p => {
    const key = p.method in breakdown ? p.method : 'OTHER';
    breakdown[key] += p.amount;
  });

  // Remove zero-value methods from response to keep UI clean
  return Object.fromEntries(Object.entries(breakdown).filter(([, v]) => v > 0));
};

export const getMarginAnalysis = async (venueId) => {
  const products = await prisma.product.findMany({
    where: { venueId },
    include: { ingredients: { include: { stockItem: true } } }
  });

  return products.map(p => {
    const cost = p.ingredients.reduce((sum, ing) =>
      sum + (ing.quantity * (ing.stockItem?.costPerUnit || 0)), 0);
    const margin = p.price > 0 ? ((p.price - cost) / p.price) * 100 : 0;
    return { name: p.name, price: p.price, cost: Math.round(cost), margin: Math.round(margin) };
  });
};

export const getAlerts = async (venueId) => {
  const alerts = [];

  const allStock = await prisma.stockItem.findMany({ where: { venueId } });
  allStock.filter(s => s.amount <= s.threshold).forEach(s => {
    alerts.push({
      type: 'LOW_STOCK', severity: 'WARNING',
      title: 'ክምችት አነስተኛ ነው',
      desc:  `${s.name} is below threshold (${s.amount} remaining).`,
      timestamp: new Date()
    });
  });

  const margins = await getMarginAnalysis(venueId);
  margins.forEach(m => {
    if (m.margin < 40) {
      alerts.push({
        type: 'MARGIN_RISK', severity: 'CRITICAL',
        title: 'ትርፍ አደጋ',
        desc:  `${m.name} margin is ${m.margin}% (below 40% threshold).`,
        timestamp: new Date()
      });
    }
  });

  return alerts;
};

// ─── Phase 4: EFY Monthly Revenue Report ──────────────────────────────────────
/**
 * Returns revenue grouped by Ethiopian Fiscal Year month for the current EFY year.
 * Used by the Owner dashboard's EFY bar chart.
 */
export const getEfyReport = async (venueId) => {
  // EFY starts Meskerem 1 (approx Sept 11 Gregorian)
  const now        = new Date();
  const gcYear     = now.getFullYear();
  const efyStart   = new Date(now.getMonth() >= 8 ? `${gcYear}-09-11` : `${gcYear - 1}-09-11`);
  efyStart.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { venueId, createdAt: { gte: efyStart }, status: 'DONE' }
  });

  // Initialize all 13 months to zero
  const monthlyRevenue = ET_MONTHS.map((name, idx) => ({
    month: idx + 1,
    monthName: name,
    revenue: 0,
    orderCount: 0,
  }));

  orders.forEach(o => {
    const { month } = toEthiopianMonth(new Date(o.createdAt));
    const idx = month - 1;
    if (idx >= 0 && idx < 13) {
      monthlyRevenue[idx].revenue    += o.total;
      monthlyRevenue[idx].orderCount += 1;
    }
  });

  const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0);
  const peakMonth    = monthlyRevenue.reduce((a, b) => b.revenue > a.revenue ? b : a);

  return {
    efyYear: now.getMonth() >= 8 ? (gcYear - 7) : (gcYear - 8),
    efyStart: efyStart.toISOString(),
    months: monthlyRevenue,
    totalRevenue,
    peakMonth,
    averageMonthlyRevenue: totalRevenue / 13,
  };
};

