// apps/client/src/components/ZReport.jsx
import React from 'react';
import { formatETB } from '../store/useStore';
import { TrendingUp, Package, Wallet, List, Clock, User } from 'lucide-react';

const ZReport = ({ report }) => {
  if (!report) return null;

  const { shift, totalRevenue, revenueByMethod, topItems, orderCount, averageOrderValue } = report;

  return (
    <div className="space-y-12 animate-fade-in">
      {/* ── HEADER SUMMARY ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: formatETB(totalRevenue), icon: <TrendingUp size={16} />, color: 'bg-black/5' },
          { label: 'Orders Settled', value: orderCount, icon: <Package size={16} />, color: 'bg-black/5' },
          { label: 'Average Order', value: formatETB(averageOrderValue), icon: <Clock size={16} />, color: 'bg-black/5' },
          { label: 'Cash Variance', value: formatETB(shift.cashVariance), icon: <AlertTriangle size={16} />, color: shift.cashVariance < 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600' }
        ].map((card, i) => (
          <div key={i} className={`p-6 rounded-3xl ${card.color} space-y-2`}>
            <div className="flex justify-between items-center opacity-40">
              <span className="text-[9px] font-black uppercase tracking-widest">{card.label}</span>
              {card.icon}
            </div>
            <p className="text-2xl font-serif font-black text-[#120B05]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* ── REVENUE BY METHOD ── */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-black/30 flex items-center gap-3">
            <Wallet size={12} /> Revenue by Payment Method
          </h4>
          <div className="bg-white rounded-3xl border-0.5 border-black/5 p-8 space-y-4 shadow-sm">
            {Object.entries(revenueByMethod).map(([method, amount]) => (
              <div key={method} className="flex justify-between items-center pb-4 border-b border-black/5 last:border-0 last:pb-0">
                <span className="text-sm font-bold text-black/60">{method}</span>
                <span className="font-serif font-black text-[#120B05]">{formatETB(amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── TOP ITEMS ── */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-black/30 flex items-center gap-3">
            <TrendingUp size={12} /> Top Selling Products
          </h4>
          <div className="bg-white rounded-3xl border-0.5 border-black/5 p-8 space-y-4 shadow-sm">
            {topItems.map((item, i) => (
              <div key={i} className="flex justify-between items-center pb-4 border-b border-black/5 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-black/60">{item.name}</p>
                    <p className="text-[9px] font-black uppercase text-black/20">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-serif font-black text-[#120B05]">{formatETB(item.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AUDIT LIST ── */}
      <div className="space-y-6">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-black/30 flex items-center gap-3">
          <List size={12} /> Order Audit Trail
        </h4>
        <div className="bg-white rounded-[40px] border-0.5 border-black/5 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#120B05] text-white">
              <tr>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest">Time</th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest">Customer</th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest">Total</th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest">Payments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {shift.orders.map(order => (
                <tr key={order.id} className="hover:bg-black/5 transition-all">
                  <td className="px-8 py-5 text-[10px] text-black/40 font-bold">{new Date(order.createdAt).toLocaleTimeString()}</td>
                  <td className="px-8 py-5 font-black text-[#120B05]">{order.customer || 'Guest'}</td>
                  <td className="px-8 py-5 font-serif font-black text-[#120B05]">{formatETB(order.total)}</td>
                  <td className="px-8 py-5">
                    <div className="flex gap-2">
                      {order.payments.map(p => (
                        <span key={p.id} className="text-[8px] bg-[#D49E4A]/10 text-[#D49E4A] px-2 py-1 rounded-md font-black uppercase">
                          {p.method}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AlertTriangle = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

export default ZReport;
