import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  IndianRupee, 
  Users, 
  AlertCircle, 
  ChevronRight, 
  ArrowLeft,
  X,
  PieChart,
  Target
} from 'lucide-react';
import { getFeesRegistry, clearSummary } from '../store/slices/feeSlice';
import FeeRegistryTable from '../features/fees/FeeRegistryTable';
import StudentFeeSection from '../features/students/StudentFeeSection';

export default function FeeManagementPage() {
  const dispatch = useDispatch();
  const { registry, stats, loading, error } = useSelector(state => state.fees);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  useEffect(() => {
    dispatch(getFeesRegistry());
  }, [dispatch]);
  
  // Keep selected student synced with registry updates (e.g. after a payment)
  useEffect(() => {
    if (selectedStudent && registry.length > 0) {
      const updated = registry.find(s => s.id === selectedStudent.id);
      if (updated) setSelectedStudent(updated);
    }
  }, [registry]);

  const totalCollected = registry.reduce((sum, item) => sum + item.totalPaid, 0);
  const totalPending = registry.reduce((sum, item) => sum + item.totalPending, 0);
  const totalDefaulters = registry.filter(item => item.isDefaulter).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-20 px-4 sm:px-0">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-emerald-500" />
            </div>
            <h1 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Financial Treasury</h1>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
            Fees & <span className="text-zinc-600">Ledgers</span>
          </h2>
          <p className="text-zinc-500 text-sm mt-3 font-medium">
            Manage institutional tariffs, record student payments, and track fiscal health.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-3xl border border-white/5 backdrop-blur-xl shrink-0">
          <div className="px-6 py-3 border-r border-white/5">
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Collection</p>
            <span className="text-xl font-black text-emerald-500 italic">₹{totalCollected.toLocaleString()}</span>
          </div>
          <div className="px-6 py-3">
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Receivables</p>
            <span className="text-xl font-black text-rose-500 italic">₹{totalPending.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatTile label="Recovery Rate" value={`${Math.round((totalCollected / (totalCollected + totalPending || 1)) * 100)}%`} icon={Target} color="emerald" />
        <StatTile label="Critical Defaulters" value={totalDefaulters} icon={AlertCircle} color="rose" />
        <StatTile label="Registry Students" value={registry.length} icon={Users} color="blue" />
      </div>

      {/* MONTHLY TREASURY BREAKDOWN */}
      {!selectedStudent && stats?.monthlyStats && (
        <div className="bg-zinc-900/40 border border-white/5 rounded-[40px] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
             <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <PieChart size={24} />
             </div>
             <div>
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-1">Monthly Yield Focus</h3>
                <div className="flex items-center gap-3">
                  <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                    {new Date(0, selectedPeriod.month - 1).toLocaleString('en-US', { month: 'long' })} {selectedPeriod.year}
                  </h4>
                  <div className="relative">
                    <select 
                      value={`${selectedPeriod.month}-${selectedPeriod.year}`}
                      onChange={(e) => {
                        const [m, y] = e.target.value.split('-');
                        setSelectedPeriod({ month: Number(m), year: Number(y) });
                      }}
                      className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black text-zinc-400 uppercase tracking-widest outline-none cursor-pointer hover:border-blue-500/30 transition-all appearance-none pr-8"
                    >
                      {/* Show current month even if no stats yet, plus all months with stats */}
                      <option value={`${new Date().getMonth() + 1}-${new Date().getFullYear()}`}>
                        Current: {new Date().toLocaleString('en-US', { month: 'short' })} {new Date().getFullYear()}
                      </option>
                      {stats.monthlyStats
                        .filter(s => !(s.month === new Date().getMonth()+1 && s.year === new Date().getFullYear()))
                        .map(s => (
                          <option key={`${s.month}-${s.year}`} value={`${s.month}-${s.year}`}>
                            {new Date(0, s.month-1).toLocaleString('en-US', { month: 'short' })} {s.year}
                          </option>
                      ))}
                    </select>
                    <ChevronRight size={12} className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-zinc-600 pointer-events-none" />
                  </div>
                </div>
             </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 min-w-[200px] text-right">
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1.5">Collection Aggregate</p>
            <div className="text-3xl font-black text-white italic tracking-tighter">
              ₹{(stats.monthlyStats?.find(s => s.month === selectedPeriod.month && s.year === selectedPeriod.year)?.amount || 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <AnimatePresence mode="wait">
          {!selectedStudent ? (
            <motion.div
              key="table"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <FeeRegistryTable 
                registry={registry} 
                onSelectStudent={setSelectedStudent}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* BACK BUTTON */}
              <div className="lg:col-span-3">
                <button 
                  onClick={() => {
                    setSelectedStudent(null);
                    dispatch(clearSummary());
                    dispatch(getFeesRegistry()); // Refresh registry
                  }}
                  className="flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white hover:border-white/10 transition-all"
                >
                  <ArrowLeft size={14} strokeWidth={3} />
                  Return to Registry
                </button>
              </div>

              {/* STUDENT BRIEF */}
              <div className="bg-[#09090b] border border-white/5 rounded-[40px] p-8 shadow-2xl h-fit">
                 <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black text-white italic">
                      {selectedStudent.fullName[0]}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white italic leading-tight uppercase tracking-tight">{selectedStudent.fullName}</h4>
                      <p className="text-zinc-500 text-[10px] mt-1.5 font-bold uppercase tracking-widest">{selectedStudent.mobile}</p>
                    </div>
                 </div>

                 <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Enrollment Status</span>
                       <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[9px] font-black uppercase">{selectedStudent.status}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Base Subscription</span>
                       <span className="text-sm font-black text-white italic">₹{selectedStudent.monthlyFee}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Last Transaction</span>
                       <span className="text-[10px] font-black text-blue-400 italic text-right max-w-[150px]">
                         {selectedStudent.lastPaymentDetails 
                           ? `₹${selectedStudent.lastPaymentDetails.amount} for ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][selectedStudent.lastPaymentDetails.month-1]} on ${new Date(selectedStudent.lastPaymentDetails.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`
                           : 'None'}
                       </span>
                    </div>
                 </div>
              </div>

              {/* FULL LEDGER COMPONENT */}
              <div className="lg:col-span-2 bg-[#09090b] border border-white/5 rounded-[40px] p-10 overflow-hidden shadow-2xl">
                 <StudentFeeSection studentId={selectedStudent.id} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const StatTile = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  };

  return (
    <div className="p-8 rounded-[40px] bg-zinc-900/30 border border-white/5 transition-all hover:bg-zinc-800/40 shadow-xl group">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colors[color]} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
      </div>
      <span className="text-3xl font-black text-white tracking-tighter italic">{value}</span>
    </div>
  );
};
