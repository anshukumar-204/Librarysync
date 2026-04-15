import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  IndianRupee, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '../../utils/cn';

export default function FeeRegistryTable({ registry, onSelectStudent, searchQuery, setSearchQuery }) {
  const filteredRegistry = registry.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const name = (item.fullName || item.name || '').toLowerCase();
    const mobile = (item.mobile || item.user?.mobile || '').toString();

    return name.includes(searchLower) || mobile.includes(searchQuery);
  });

  return (
    <div className="bg-[#09090b] border border-white/5 rounded-[40px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)] flex flex-col h-[600px]">
      {/* TABLE HEADER / TOOLBAR */}
      <div className="px-8 py-8 border-b border-white/[0.03] bg-zinc-900/20 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight leading-none uppercase italic">Financial Registry</h3>
            <p className="text-zinc-500 text-[10px] mt-2 font-black uppercase tracking-[0.2em]">Monitoring {registry.length} active billing accounts</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            placeholder="Search student or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-zinc-800/50 border border-white/5 rounded-2xl py-3.5 pl-11 pr-6 text-[11px] font-bold text-white focus:outline-none focus:border-blue-500/30 transition-all w-72 placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* TABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar focus:outline-none">
        <div className="grid gap-3">
          {filteredRegistry.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onSelectStudent(item)}
              className="group relative bg-zinc-900/40 border border-white/5 p-5 rounded-[28px] hover:bg-zinc-800/50 transition-all flex items-center justify-between gap-6 cursor-pointer"
            >
              <div className="flex items-center gap-5">
                <div className={cn(
                  "w-14 h-14 rounded-2xl border flex items-center justify-center text-xl font-black group-hover:scale-105 transition-transform",
                  item.isDefaulter 
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-500" 
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                )}>
                  {(item.fullName || item.name || 'S')[0]}
                </div>
                <div>
                  <h4 className="font-black text-white tracking-tight uppercase italic">{item.fullName || item.name || 'Unknown Student'}</h4>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">{item.mobile || item.user?.mobile || 'N/A'}</span>
                    <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                    <span className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase">Tariff: ₹{item.monthlyFee}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="text-right">
                  <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1.5">Ledger Balance</div>
                  <div className={cn(
                    "text-lg font-black italic flex items-center justify-end gap-1",
                    item.totalPending > 0 ? "text-rose-500" : "text-emerald-500"
                  )}>
                    <IndianRupee size={14} strokeWidth={3} />
                    {item.totalPending}
                    {item.totalPending > 0 ? <TrendingDown size={14} className="ml-1" /> : <TrendingUp size={14} className="ml-1" />}
                  </div>
                </div>

                <div className="w-32">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Collection</span>
                    <span className="text-[9px] font-black text-white italic">{Math.round((item.totalPaid / (item.totalPaid + item.totalPending || 1)) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-700",
                        item.isDefaulter ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      )}
                      style={{ width: `${Math.round((item.totalPaid / (item.totalPaid + item.totalPending || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                   <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">
                     {item.lastPaymentDetails 
                       ? `Last: ₹${item.lastPaymentDetails.amount} for ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][item.lastPaymentDetails.month-1]} on ${new Date(item.lastPaymentDetails.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`
                       : 'No payments recorded'}
                   </div>
                   {item.isDefaulter ? (
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg animate-pulse">
                        <AlertCircle size={10} className="text-rose-500" />
                        <span className="text-[8px] font-black text-rose-400 uppercase tracking-tighter">Overdue</span>
                     </div>
                   ) : (
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <CheckCircle2 size={10} className="text-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter">Healthy</span>
                     </div>
                   )}
                   <ChevronRight size={16} className="text-zinc-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </motion.div>
          ))}
          {filteredRegistry.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-700 space-y-4">
              <AlertCircle className="w-12 h-12 opacity-20" />
              <p className="text-[11px] font-black uppercase tracking-[0.3em]">No matching financial records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
