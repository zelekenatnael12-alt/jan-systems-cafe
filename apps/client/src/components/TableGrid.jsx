// apps/client/src/components/TableGrid.jsx
import React from 'react';

const TableGrid = ({ tables, onTableClick, activeTableId }) => {
  const mainTables = tables.filter(t => t.zone === 'MAIN');
  const balconyTables = tables.filter(t => t.zone === 'BALCONY');

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'OCCUPIED': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'RESERVED': return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      case 'CLOSED': return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-500';
      case 'OCCUPIED': return 'bg-amber-500';
      case 'RESERVED': return 'bg-purple-500';
      case 'CLOSED': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  const TableCard = ({ table }) => (
    <button
      onClick={() => onTableClick(table)}
      className={`relative p-4 rounded-2xl border transition-all duration-300 group overflow-hidden ${getStatusColor(table.status)} ${
        activeTableId === table.id ? 'ring-2 ring-[#D49E4A] scale-105 shadow-xl' : 'hover:scale-102 hover:shadow-lg'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-2xl font-black font-serif">#{table.number}</span>
        <div className={`w-2 h-2 rounded-full ${getStatusDot(table.status)} animate-pulse`}></div>
      </div>
      <div className="text-[10px] uppercase tracking-tighter font-bold opacity-60">
        {table.seats} Seats • {table.status}
      </div>
      
      {/* ── LUXURY DECOR ── */}
      <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all"></div>
    </button>
  );

  return (
    <div className="space-y-8">
      {/* ── MAIN LOUNGE ── */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#120B05]/40 mb-4 px-2">Main Lounge</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mainTables.map(t => <TableCard key={t.id} table={t} />)}
        </div>
      </div>

      {/* ── BALCONY ── */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#120B05]/40 mb-4 px-2">Balcony Terrace</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {balconyTables.map(t => <TableCard key={t.id} table={t} />)}
        </div>
      </div>
    </div>
  );
};

export default TableGrid;
