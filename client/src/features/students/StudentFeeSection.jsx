import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Plus, 
  History, 
  ChevronDown, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  IndianRupee,
  CalendarDays
} from 'lucide-react';
import { getAdminFeeSummary, recordFeePayment, getFeesRegistry } from '../../store/slices/feeSlice';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

export default function StudentFeeSection({ studentId }) {
  const dispatch = useDispatch();
  const { summary, loading } = useSelector(state => state.fees);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [viewMode, setViewMode] = useState('cycles'); // 'cycles' or 'journal'
  const [paymentData, setPaymentData] = useState({
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    remarks: ''
  });

  useEffect(() => {
    if (studentId) {
      dispatch(getAdminFeeSummary(studentId));
    }
  }, [dispatch, studentId]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentData.amount || !paymentData.month || !paymentData.year) {
      return toast.error("Please fill all payment fields");
    }

    try {
      await dispatch(recordFeePayment({
        studentId,
        ...paymentData
      })).unwrap();
      
      toast.success("Payment recorded successfully");
      setShowPaymentForm(false);
      setPaymentData({
        amount: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        remarks: ''
      });
      // Refresh summary and global registry for stats
      dispatch(getAdminFeeSummary(studentId));
      dispatch(getFeesRegistry());
    } catch (err) {
      toast.error(err || "Failed to record payment");
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
        <p className="text-[10px] font-black uppercase tracking-widest">Accessing Financial Vault...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[28px] relative overflow-hidden group">
            <div className="relative z-10">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Paid</p>
                <h4 className="text-2xl font-black text-emerald-500 italic flex items-center gap-1">
                    <IndianRupee size={18} strokeWidth={3} />
                    {summary?.summary?.totalPaid || 0}
                </h4>
            </div>
            <CreditCard className="absolute -right-2 -bottom-2 w-16 h-16 text-emerald-500/5 rotate-12 group-hover:scale-110 transition-transform" />
        </div>
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[28px] relative overflow-hidden group">
            <div className="relative z-10">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Pending</p>
                <h4 className="text-2xl font-black text-rose-500 italic flex items-center gap-1 text-rose-500">
                    <IndianRupee size={18} strokeWidth={3} />
                    {summary?.summary?.totalPending || 0}
                </h4>
            </div>
            <AlertCircle className="absolute -right-2 -bottom-2 w-16 h-16 text-rose-500/5 -rotate-12 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setViewMode('cycles')}
            className={cn(
              "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
              viewMode === 'cycles' ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Billing Cycles
          </button>
          <button 
            onClick={() => setViewMode('journal')}
            className={cn(
              "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
              viewMode === 'journal' ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Payment Journal
          </button>
        </div>
        <button 
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
        >
            <Plus size={14} strokeWidth={3} />
            {showPaymentForm ? 'Cancel Entry' : 'Manual Receipt'}
        </button>
      </div>

      {/* PAYMENT FORM */}
      <AnimatePresence>
        {showPaymentForm && (
            <motion.form 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleRecordPayment}
                className="bg-zinc-900/80 border border-blue-500/20 p-6 rounded-[32px] overflow-hidden space-y-5"
            >
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 tracking-widest block mb-1.5">Amount (₹)</label>
                        <input 
                            type="number"
                            value={paymentData.amount}
                            onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                            placeholder="500"
                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-blue-500/30 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 tracking-widest block mb-1.5">Month</label>
                        <select 
                            value={paymentData.month}
                            onChange={(e) => setPaymentData({...paymentData, month: e.target.value})}
                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm font-bold text-white outline-none appearance-none cursor-pointer"
                        >
                            {Array.from({length: 12}, (_, i) => (
                                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('en-US', { month: 'long' })}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 tracking-widest block mb-1.5">Year</label>
                        <select 
                            value={paymentData.year}
                            onChange={(e) => setPaymentData({...paymentData, year: e.target.value})}
                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm font-bold text-white outline-none appearance-none cursor-pointer"
                        >
                            {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 tracking-widest block mb-1.5">Remarks</label>
                        <input 
                            type="text"
                            value={paymentData.remarks}
                            onChange={(e) => setPaymentData({...paymentData, remarks: e.target.value})}
                            placeholder="Optional notes..."
                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-blue-500/30 transition-all"
                        />
                    </div>
                </div>
                <button 
                    type="submit"
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/10"
                >
                    Authorize Payment Node
                </button>
            </motion.form>
        )}
      </AnimatePresence>

      {/* DATA VIEW */}
      <div className="space-y-3">
        {viewMode === 'cycles' ? (
          <>
            {summary?.history?.map((cycle, idx) => (
                <div key={idx} className="bg-zinc-900/30 border border-white/[0.03] p-5 rounded-[24px] flex items-center justify-between group hover:bg-zinc-900/50 transition-all">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center border font-black text-lg",
                            cycle.status === 'PAID' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                            cycle.status === 'PARTIAL' ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                            "bg-rose-500/10 border-rose-500/20 text-rose-500"
                        )}>
                            {cycle.month}
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black text-white uppercase tracking-tight italic">
                                {new Date(0, cycle.month - 1).toLocaleString('en-US', { month: 'long' })} {cycle.year}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black text-zinc-500 tracking-widest uppercase">Due: ₹{cycle.expected}</span>
                                <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                <span className={cn(
                                    "text-[9px] font-black tracking-widest uppercase",
                                    cycle.status === 'PAID' ? "text-emerald-500" : "text-rose-500"
                                )}>Paid: ₹{cycle.paid}</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <span className={cn(
                            "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                            cycle.status === 'PAID' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            cycle.status === 'PARTIAL' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                            "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        )}>
                            {cycle.status}
                        </span>
                        {cycle.isOverdue && (
                            <p className="text-[7px] font-black text-rose-500 uppercase tracking-tighter mt-1 animate-pulse">Overdue Threshold Crossed</p>
                        )}
                    </div>
                </div>
            ))}
            {!summary?.history?.length && (
                <div className="h-32 flex flex-col items-center justify-center text-zinc-700 bg-zinc-900/20 rounded-[32px] border border-dashed border-white/5">
                    <CalendarDays className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-[8px] font-black uppercase tracking-[0.3em]">No billing cycles found</p>
                </div>
            )}
          </>
        ) : (
          <>
            {summary?.payments?.map((payment, idx) => (
                <div key={payment.id || idx} className="bg-zinc-900/30 border border-emerald-500/5 p-5 rounded-[24px] flex items-center justify-between group hover:bg-zinc-900/50 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <CheckCircle2 size={20} strokeWidth={3} />
                        </div>
                        <div>
                            <h4 className="text-[12px] font-black text-emerald-500 italic">₹{payment.amount} Receipt</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                                    {new Date(payment.paymentDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                <span className="text-[9px] font-bold text-zinc-600 text-zinc-500 truncate max-w-[150px]">
                                    {payment.remarks || `Monthly sub for ${new Date(0, payment.month - 1).toLocaleString('en-US', { month: 'short' })}`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            {!summary?.payments?.length && (
                <div className="h-32 flex flex-col items-center justify-center text-zinc-700 bg-zinc-900/20 rounded-[32px] border border-dashed border-white/5">
                    <History className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-[8px] font-black uppercase tracking-[0.3em]">No payment records found</p>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
