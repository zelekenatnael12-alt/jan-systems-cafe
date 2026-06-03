// apps/client/src/components/ShiftCloseModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { formatETB } from '../store/useStore';
import { X, ArrowRight, Banknote, AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ShiftCloseModal = ({ shift, onClose, onShiftClosed }) => {
  const [step, setStep] = useState(1);
  const [physicalCash, setPhysicalCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  
  const token = localStorage.getItem('jan_token');
  const user = JSON.parse(localStorage.getItem('jan_user') || '{}');

  const handleCloseShift = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/shifts/close`, {
        shiftId: shift.id,
        physicalCash: parseFloat(physicalCash),
        closedBy: user.name || user.email,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const reportRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/shifts/${shift.id}/report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReport(reportRes.data);
      setStep(3);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to close shift');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(18, 11, 5); // Espresso
    doc.text('JAN SYSTEMS - Z REPORT', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Shift: ${report.shift.name}`, 20, 35);
    doc.text(`Date: ${new Date(report.shift.openedAt).toLocaleDateString()}`, 20, 40);
    doc.text(`Closed By: ${report.shift.closedBy}`, 20, 45);

    // Revenue Table
    const revenueData = Object.entries(report.revenueByMethod).map(([method, amount]) => [method, formatETB(amount)]);
    doc.autoTable({
      startY: 55,
      head: [['Payment Method', 'Amount']],
      body: revenueData,
      theme: 'grid',
      headStyles: { fillStyle: [212, 158, 74] } // Amber
    });

    // Top Items
    const itemData = report.topItems.map(item => [item.name, item.quantity, formatETB(item.revenue)]);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Top Selling Items', 'Qty', 'Revenue']],
      body: itemData,
      theme: 'grid'
    });

    // Reconciliation
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.text(`System Cash: ${formatETB(report.shift.systemCash)}`, 20, finalY);
    doc.text(`Physical Cash: ${formatETB(report.shift.physicalCash)}`, 20, finalY + 7);
    doc.setFontSize(14);
    doc.setTextColor(report.shift.cashVariance < 0 ? [220, 38, 38] : [22, 163, 74]);
    doc.text(`Variance: ${formatETB(report.shift.cashVariance)}`, 20, finalY + 17);

    doc.save(`JanSystems_ShiftReport_${report.shift.name}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-[#120B05]/95 backdrop-blur-xl flex items-center justify-center p-6 z-[110] animate-fade-in">
      <div className="glass-dark w-full max-w-2xl p-10 rounded-[50px] shadow-2xl border-0.5 border-white/10 text-white space-y-10">
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${step === 3 ? 'bg-green-500' : 'bg-[#D49E4A]'} animate-pulse`}></div>
            <h3 className="text-3xl font-serif font-black tracking-tightest">ሽፍት መዝጊያ (Shift Close)</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="bg-white/5 p-8 rounded-[35px] space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#D49E4A]">Preliminary Stats</h4>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[8px] uppercase opacity-40 mb-1">Orders Settled</p>
                  <p className="text-3xl font-serif font-black">{shift.summary?.orderCount || 0}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase opacity-40 mb-1">Shift Duration</p>
                  <p className="text-3xl font-serif font-black">
                    {Math.floor((new Date() - new Date(shift.openedAt)) / 3600000)}h {Math.floor(((new Date() - new Date(shift.openedAt)) % 3600000) / 60000)}m
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setStep(2)}
              className="w-full py-6 bg-white text-[#120B05] rounded-[30px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 hover:bg-[#D49E4A] transition-all"
            >
              Next: Cash Reconciliation <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center space-y-4">
              <Banknote size={60} className="mx-auto text-[#D49E4A]" />
              <h4 className="text-2xl font-serif font-black">Enter Physical Cash</h4>
              <p className="text-[10px] uppercase tracking-widest text-white/40">Total cash physically found in the drawer</p>
            </div>
            <div className="space-y-6">
              <input 
                type="number" 
                autoFocus
                placeholder="0.00"
                className="w-full bg-white/5 border-0.5 border-white/10 rounded-[30px] px-10 py-8 text-5xl font-serif font-black text-center focus:outline-none focus:border-[#D49E4A] transition-all"
                value={physicalCash}
                onChange={e => setPhysicalCash(e.target.value)}
              />
              <textarea 
                placeholder="Shift Notes (e.g. Broken glass, supply purchase from drawer...)"
                className="w-full bg-white/5 border-0.5 border-white/10 rounded-3xl px-8 py-4 text-xs focus:outline-none focus:border-[#D49E4A] transition-all h-24 resize-none"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              ></textarea>
            </div>
            <button 
              onClick={handleCloseShift}
              disabled={loading || !physicalCash}
              className="w-full py-6 bg-[#D49E4A] text-[#120B05] rounded-[30px] font-black uppercase tracking-widest text-xs hover:bg-white transition-all disabled:opacity-30"
            >
              {loading ? 'Processing Reconcilation...' : 'Finalize & Reveal Variance'}
            </button>
          </div>
        )}

        {step === 3 && report && (
          <div className="space-y-8 animate-fade-in-up">
            <div className={`p-10 rounded-[40px] border-2 text-center space-y-6 ${report.shift.cashVariance < 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
              {report.shift.cashVariance === 0 ? (
                <CheckCircle2 size={60} className="mx-auto text-green-500" />
              ) : (
                <AlertTriangle size={60} className={`mx-auto ${report.shift.cashVariance < 0 ? 'text-red-500' : 'text-green-500'}`} />
              )}
              
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Variance Report</p>
                <h2 className="text-6xl font-serif font-black">{formatETB(report.shift.cashVariance)}</h2>
                <p className={`text-[10px] font-black uppercase tracking-widest ${report.shift.cashVariance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {report.shift.cashVariance < 0 ? 'Cash Shortage Detected' : report.shift.cashVariance > 0 ? 'Cash Overage Detected' : 'Perfect Reconciliation'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                <div className="text-left">
                  <p className="text-[8px] uppercase opacity-40">System Record</p>
                  <p className="text-xl font-serif font-black">{formatETB(report.shift.systemCash)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] uppercase opacity-40">Physical Count</p>
                  <p className="text-xl font-serif font-black">{formatETB(report.shift.physicalCash)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={exportPDF}
                className="flex-1 py-5 bg-white/10 hover:bg-white/20 rounded-3xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all"
              >
                <Download size={14} /> Export Z-Report PDF
              </button>
              <button 
                onClick={onShiftClosed}
                className="flex-1 py-5 bg-white text-[#120B05] rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-[#D49E4A] transition-all"
              >
                Close & Exit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftCloseModal;
