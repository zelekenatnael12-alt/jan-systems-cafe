// apps/client/src/components/ShiftManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatETB } from '../store/useStore';
import { Play, StopCircle, Clock, TrendingUp, Package } from 'lucide-react';

const ShiftManager = ({ onShiftCloseInitiated }) => {
  const [currentShift, setCurrentShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shiftName, setShiftName] = useState('');
  const token = localStorage.getItem('jan_token');
  const user = JSON.parse(localStorage.getItem('jan_user') || '{}');

  useEffect(() => {
    fetchCurrentShift();
  }, []);

  const fetchCurrentShift = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/shifts/current`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentShift(res.data);
    } catch (err) {
      console.error('Failed to fetch shift', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async () => {
    if (!shiftName) return alert('Enter shift name');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/shifts/open`, {
        name: shiftName,
        openedBy: user.name || user.email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentShift(res.data);
      setShiftName('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to open shift');
    }
  };

  if (loading) return <div className="animate-pulse glass p-8 rounded-3xl h-32"></div>;

  if (!currentShift) {
    return (
      <div className="glass p-8 rounded-[40px] border-0.5 border-black/5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 bg-amber-500/5">
        <div className="space-y-2">
          <h3 className="text-2xl font-serif font-black tracking-tight text-[#120B05]">ምንም ክፍት ሽፍት የለም (No Active Shift)</h3>
          <p className="text-[10px] uppercase tracking-widest text-[#D49E4A] font-black">Open a shift to start recording sales</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Shift Name (e.g. Morning)" 
            className="flex-1 md:w-64 bg-white/50 border-0.5 border-black/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#D49E4A] font-bold"
            value={shiftName}
            onChange={e => setShiftName(e.target.value)}
          />
          <button 
            onClick={handleOpenShift}
            className="px-10 py-4 bg-[#120B05] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#D49E4A] transition-all flex items-center gap-3 shadow-xl"
          >
            <Play size={14} fill="currentColor" /> Open Shift
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass p-8 rounded-[40px] border-0.5 border-black/5 shadow-2xl space-y-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-10 opacity-5">
        <TrendingUp size={120} />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-serif font-black tracking-tight text-[#120B05]">{currentShift.name}</h3>
            <span className="px-3 py-1 bg-green-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full animate-pulse">ACTIVE</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-black/30">
            <div className="flex items-center gap-1.5"><Clock size={12} /> Opened at {new Date(currentShift.openedAt).toLocaleTimeString()}</div>
            <div className="flex items-center gap-1.5"><TrendingUp size={12} /> By {currentShift.openedBy}</div>
          </div>
        </div>

        <button 
          onClick={() => onShiftCloseInitiated(currentShift)}
          className="px-10 py-5 bg-red-500 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all flex items-center gap-3 shadow-xl group"
        >
          <StopCircle size={16} className="group-hover:scale-110 transition-transform" /> Close Day / Z-Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/5 p-6 rounded-3xl space-y-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-black/40">Running Revenue</p>
          <p className="text-2xl font-serif font-black text-[#120B05]">{formatETB(currentShift.summary?.totalRevenue || 0)}</p>
        </div>
        <div className="bg-black/5 p-6 rounded-3xl space-y-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-black/40">Orders Settled</p>
          <p className="text-2xl font-serif font-black text-[#120B05]">{currentShift.summary?.orderCount || 0}</p>
        </div>
        <div className="bg-black/5 p-6 rounded-3xl space-y-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-black/40">Avg Order Value</p>
          <p className="text-2xl font-serif font-black text-[#120B05]">
            {formatETB(currentShift.summary?.orderCount > 0 ? currentShift.summary.totalRevenue / currentShift.summary.orderCount : 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShiftManager;
