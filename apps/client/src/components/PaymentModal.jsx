// apps/client/src/components/PaymentModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { formatETB, useStore } from '../store/useStore';
import { X, CreditCard, Banknote, Smartphone, Plus, CheckCircle2, Building2, Network, QrCode, RefreshCw, Clock } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

// Mobile money methods that support QR-code initiation
const QR_METHODS = ['TELEBIRR', 'CBE_BIRR', 'ETHIOPAY'];

const METHODS = [
  { id: 'CASH',          icon: Banknote,   label: 'ጥሬ ገንዘብ',  en: 'Cash',          configKey: 'enableCash' },
  { id: 'TELEBIRR',      icon: Smartphone, label: 'ቴሌብር',      en: 'Telebirr',      configKey: 'enableTelebirr' },
  { id: 'CBE_BIRR',      icon: CreditCard, label: 'CBE ብር',     en: 'CBE Birr',      configKey: 'enableCbeBirr' },
  { id: 'ETHIOPAY',      icon: Network,    label: 'ኢትዮፔይ',     en: 'EthioPay',      configKey: 'enableEthiopay' },
  { id: 'BANK_TRANSFER', icon: Building2,  label: 'ባንክ ዝውውር',  en: 'Bank Transfer', configKey: 'enableBankTransfer' },
  { id: 'OTHER',         icon: Plus,       label: 'ሌላ',         en: 'Other',         configKey: null },
];

const PaymentModal = ({ order, onClose, onPaymentComplete }) => {
  const [payments, setPayments]     = useState([]);
  const [amount, setAmount]         = useState('');
  const [method, setMethod]         = useState('CASH');
  const [note, setNote]             = useState('');
  const [reference, setReference]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [qrData, setQrData]         = useState(null);   // { qrUrl, transactionRef, expiresAt, sandbox }
  const [qrLoading, setQrLoading]   = useState(false);
  const [qrCountdown, setQrCountdown] = useState(0);
  const token = localStorage.getItem('jan_token');
  const { config } = useStore();

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchPayments(); }, [order.id]);

  // Countdown timer for QR expiry
  useEffect(() => {
    if (!qrData?.expiresAt) return;
    const tick = setInterval(() => {
      const secs = Math.max(0, Math.floor((new Date(qrData.expiresAt) - Date.now()) / 1000));
      setQrCountdown(secs);
      if (secs === 0) clearInterval(tick);
    }, 1000);
    return () => clearInterval(tick);
  }, [qrData]);

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${API}/api/orders/${order.id}/payments`, { headers });
      setPayments(res.data);
    } catch {}
  };

  const totalPaid  = payments.reduce((s, p) => s + p.amount, 0);
  const remaining  = Math.max(0, order.total - totalPaid);

  // Generate QR for mobile money payment
  const initiateQr = useCallback(async () => {
    setQrLoading(true);
    setQrData(null);
    try {
      const res = await axios.post(`${API}/api/payments/initiate`, {
        provider: method,
        orderId:  order.id,
        amount:   parseFloat(amount) || remaining,
        description: `Order #${order.id.slice(-6)} — ${order.customer || 'Guest'}`,
      }, { headers });
      setQrData(res.data);
    } catch (e) {
      alert('QR generation failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setQrLoading(false);
    }
  }, [method, order, amount, remaining]);

  const handleAddPayment = async () => {
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) return alert('Enter valid amount');
    if (payAmount > remaining + 0.01) return alert('Amount exceeds remaining balance');

    setLoading(true);
    try {
      await axios.post(`${API}/api/payments`, {
        orderId: order.id,
        amount: payAmount,
        method,
        note,
        reference: (method === 'BANK_TRANSFER' || QR_METHODS.includes(method)) ? reference : undefined,
      }, { headers });
      setAmount(''); setNote(''); setReference(''); setQrData(null);
      await fetchPayments();
    } catch { alert('Payment failed'); }
    finally { setLoading(false); }
  };

  const finalizeOrder = async () => {
    if (remaining > 0.01) return alert('Order not fully paid');
    try {
      await axios.patch(`${API}/api/orders/${order.id}/status`,
        { status: 'DONE' }, { headers });
      onPaymentComplete();
    } catch { alert('Failed to finalize order'); }
  };

  const activeMethods = METHODS.filter(m => m.configKey === null || config?.[m.configKey]);
  const isQrMethod = QR_METHODS.includes(method);

  return (
    <div className="fixed inset-0 bg-[#120B05]/95 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-fade-in">
      <div className="glass-dark w-full max-w-2xl p-6 md:p-8 rounded-[40px] shadow-2xl border border-white/10 text-white flex flex-col md:flex-row gap-6 max-h-[95vh] overflow-y-auto">

        {/* ── LEFT: ORDER SUMMARY ── */}
        <div className="flex-1 space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-serif font-black">{order.customer || 'Guest'}</h3>
              <p className="text-[9px] uppercase tracking-widest text-white/40 mt-0.5">Order #{order.id.slice(-6).toUpperCase()}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={18} /></button>
          </div>

          {/* Items */}
          <div className="space-y-2 bg-white/5 p-4 rounded-2xl">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-white/60">{item.product.name} ×{item.quantity}</span>
                <span className="font-bold">{formatETB(item.product.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-2 flex justify-between font-black text-sm">
              <span>Total</span><span>{formatETB(order.total)}</span>
            </div>
          </div>

          {/* Payment history */}
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: config?.primaryColor || '#D49E4A' }}>
              Payment History
            </h4>
            <div className="space-y-2 max-h-[120px] overflow-y-auto">
              {payments.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-xl text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 uppercase">{p.method}</span>
                    {p.reference && <span className="text-white/25 font-mono text-[8px]">{p.reference.slice(0,16)}</span>}
                  </div>
                  <span className="font-black text-emerald-400">+{formatETB(p.amount)}</span>
                </div>
              ))}
              {payments.length === 0 && (
                <p className="text-center py-3 text-white/20 text-[9px] uppercase font-black">No payments yet</p>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: PAYMENT INPUT ── */}
        <div className="flex-1 space-y-4">

          {/* Remaining balance */}
          <div className="p-5 rounded-3xl text-[#120B05]" style={{ backgroundColor: config?.primaryColor || '#D49E4A' }}>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Remaining / የቀረ</p>
            <h2 className="text-3xl font-serif font-black">{formatETB(remaining)}</h2>
          </div>

          {/* Method selector */}
          <div className="grid grid-cols-3 gap-2">
            {activeMethods.map(m => (
              <button key={m.id}
                onClick={() => { setMethod(m.id); setReference(''); setQrData(null); }}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all border ${
                  method === m.id ? 'bg-white text-[#120B05] border-white shadow-lg' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'
                }`}>
                <m.icon size={14} />
                <span>{m.en}</span>
              </button>
            ))}
          </div>

          {/* ── QR CODE PANEL (Telebirr / CBE Birr / EthioPay) ── */}
          {isQrMethod && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/50 flex items-center gap-1.5">
                  <QrCode size={11} /> QR Payment
                </p>
                {qrData?.sandbox && (
                  <span className="text-[7px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Sandbox</span>
                )}
              </div>

              {!qrData && !qrLoading && (
                <div className="text-center py-2">
                  <p className="text-[9px] text-white/30 mb-3">
                    Generate a QR code for the customer to scan and pay with {method === 'CBE_BIRR' ? 'CBE Birr' : method === 'ETHIOPAY' ? 'EthioPay' : 'Telebirr'}
                  </p>
                  <button onClick={initiateQr}
                    className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all">
                    <QrCode size={12} /> Generate QR Code
                  </button>
                </div>
              )}

              {qrLoading && (
                <div className="text-center py-4">
                  <RefreshCw size={20} className="mx-auto animate-spin text-white/40" />
                  <p className="text-[9px] text-white/30 mt-2 font-black uppercase">Generating…</p>
                </div>
              )}

              {qrData && !qrLoading && (
                <div className="space-y-3">
                  {/* QR Image */}
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-2xl shadow-lg">
                      <img src={qrData.qrUrl} alt="Payment QR" className="w-36 h-36 object-contain" />
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className={`flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${qrCountdown < 60 ? 'text-red-400' : 'text-white/40'}`}>
                    <Clock size={10} />
                    {qrCountdown > 0 ? `Expires in ${Math.floor(qrCountdown/60)}:${String(qrCountdown%60).padStart(2,'0')}` : 'EXPIRED — Regenerate'}
                  </div>

                  {/* Transaction ref */}
                  <div className="bg-black/30 rounded-xl px-3 py-2">
                    <p className="text-[7px] text-white/30 font-black uppercase mb-0.5">Transaction Ref</p>
                    <p className="font-mono text-[9px] text-white/60 break-all">{qrData.transactionRef}</p>
                  </div>

                  {/* Manual confirmation input */}
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">
                      Confirmation Code (manual) / ማረጋገጫ ኮድ
                    </label>
                    <input value={reference} onChange={e => setReference(e.target.value)}
                      placeholder="Paste provider confirmation code…"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-white/30" />
                  </div>

                  {qrCountdown === 0 && (
                    <button onClick={initiateQr}
                      className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all">
                      <RefreshCw size={11} /> Regenerate QR
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bank Transfer Reference */}
          {method === 'BANK_TRANSFER' && (
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase tracking-widest text-amber-400">
                የባንክ ዋቢ ቁጥር / Bank Reference *
              </label>
              <input value={reference} onChange={e => setReference(e.target.value)}
                placeholder="e.g. TXN-2026-001234"
                className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-amber-400 transition-all text-white placeholder:text-white/30" />
            </div>
          )}

          {/* Amount + Note */}
          <div className="space-y-2">
            <input type="number" placeholder={`Amount (ETB) — ${formatETB(remaining)} remaining`}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-white/30 transition-all"
              value={amount} onChange={e => setAmount(e.target.value)} />
            <input type="text" placeholder="Note (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-white/30 transition-all"
              value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <button onClick={handleAddPayment} disabled={loading || !amount || remaining <= 0}
            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all disabled:opacity-30">
            {loading ? 'Processing…' : '+ Add Payment'}
          </button>

          <button onClick={finalizeOrder} disabled={remaining > 0.01}
            className="w-full py-4 bg-white text-[#120B05] rounded-[28px] font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg">
            <CheckCircle2 size={14} /> Finalize & Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
