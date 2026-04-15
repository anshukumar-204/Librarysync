import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserCheck, UserMinus, Clock,
  ArrowUpRight, ArrowDownRight, Activity,
  Search, Filter, MoreHorizontal, RefreshCcw,
  Zap, Calendar, BarChart3, Radio, X, AlertCircle, CheckCircle2
} from 'lucide-react';
import { fetchAdminLiveStats, fetchAdminTrends, fetchAdminHistory, forceAdminCheckout } from '../store/slices/adminDashboardSlice';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const dispatch = useDispatch();
  const { liveStats, trends, loading, error } = useSelector(state => state.adminDashboard);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, inside, left
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rescueTarget, setRescueTarget] = useState(null); // The attendance record being rescued
  const isTodaySelected = selectedDate === new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (isTodaySelected) {
      dispatch(fetchAdminLiveStats());
    } else {
      dispatch(fetchAdminHistory({ date: selectedDate }));
    }
    dispatch(fetchAdminTrends());
  }, [dispatch, isTodaySelected, selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const filteredRecords = (liveStats.records || []).filter(r => {
    const mobile = r.student?.user?.mobile || r.student?.mobile || '';
    const matchesSearch = r.student?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mobile.includes(searchQuery);

    if (statusFilter === 'inside') return matchesSearch && !r.checkOutTime;
    if (statusFilter === 'left') return matchesSearch && !!r.checkOutTime;
    return matchesSearch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <h1 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Administration Center</h1>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
            Attendance <span className="text-zinc-600">Analytics</span>
          </h2>
          <p className="text-zinc-500 text-sm mt-3 font-medium flex items-center gap-2">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            {isTodaySelected
              ? `Live records updated at ${new Date().toLocaleTimeString('en-US', { hour12: false })}`
              : `Viewing archived records for ${formatDate(selectedDate)}`}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/80 rounded-2xl border border-white/5">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="bg-transparent text-[15px] font-black text-white uppercase outline-none"
            />
          </div>
          <button
            onClick={() => isTodaySelected ? dispatch(fetchAdminLiveStats()) : dispatch(fetchAdminHistory({ date: selectedDate }))}
            className="flex items-center gap-3 px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Activity"
          value={liveStats.totalPresent ?? filteredRecords.length}
          icon={Users}
          trend={isTodaySelected ? "Today" : "Archive"}
          color="blue"
        />
        <StatCard
          label="Students Inside"
          value={liveStats.currentlyInside ?? liveStats.records?.filter(r => !r.checkOutTime).length ?? 0}
          icon={UserCheck}
          trend={isTodaySelected ? "Live" : "Archive"}
          color="emerald"
        />
        <StatCard
          label="Exits Recorded"
          value={liveStats.completed ?? liveStats.records?.filter(r => !!r.checkOutTime).length ?? 0}
          icon={UserMinus}
          trend={isTodaySelected ? "Today" : "Archive"}
          color="amber"
        />
        <StatCard
          label="Selected Date"
          value={formatDate(selectedDate)}
          icon={Calendar}
          trend="Archive"
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LIVE MONITOR */}
        <div className="lg:col-span-2 space-y-6">
          {/* FILTER TABS */}
          <div className="flex items-center gap-2 p-1.5 bg-zinc-900/80 w-fit rounded-2xl border border-white/5">
            <FilterTab active={statusFilter === 'all'} label="All Sessions" count={liveStats.records?.length || 0} onClick={() => setStatusFilter('all')} />
            <FilterTab active={statusFilter === 'inside'} label="Currently Inside" count={liveStats.records?.filter(r => !r.checkOutTime).length || 0} onClick={() => setStatusFilter('inside')} color="emerald" />
            <FilterTab active={statusFilter === 'left'} label="Already Left" count={liveStats.records?.filter(r => !!r.checkOutTime).length || 0} onClick={() => setStatusFilter('left')} color="amber" />
          </div>

          <div className="bg-[#09090b] border border-white/5 rounded-[40px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)] flex flex-col h-[600px]">
            <div className="px-8 py-8 border-b border-white/[0.03] bg-zinc-900/20 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight leading-none uppercase italic">Live Attendance</h3>
                  <p className="text-zinc-500 text-[10px] mt-2 font-black uppercase tracking-[0.2em]">
                    {isTodaySelected
                      ? `${filteredRecords.length} students currently present`
                      : `${filteredRecords.length} attendance records for ${formatDate(selectedDate)}`}
                  </p>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  placeholder="Filter by name/mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-zinc-800/50 border border-white/5 rounded-2xl py-3.5 pl-11 pr-6 text-[11px] font-bold text-white focus:outline-none focus:border-blue-500/30 transition-all w-64 placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
              <div className="grid gap-3">
                <AnimatePresence mode="popLayout">
                  {filteredRecords.map((record) => (
                    <motion.div
                      key={record.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group relative bg-zinc-900/40 border border-white/5 p-5 rounded-[28px] hover:bg-zinc-800/50 transition-all flex items-center justify-between gap-6"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center text-xl font-black text-blue-500 group-hover:scale-105 transition-transform">
                          {record.student?.fullName?.[0]}
                        </div>
                        <div>
                          <h4 className="font-black text-white tracking-tight uppercase italic">{record.student?.fullName}</h4>
                          <div className="flex items-center gap-4 mt-1.5">
                            <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">{record.student?.user?.mobile || record.student?.mobile || '--'}</span>
                            <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                            <span className="text-[10px] font-black text-blue-500/80 tracking-widest uppercase flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              IN: {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        {record.checkOutTime ? (
                          <div className="text-right">
                            <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1.5">Completed</div>
                            <div className="px-4 py-2 bg-zinc-800/50 rounded-xl text-[11px] font-black text-zinc-500 border border-white/5 uppercase">
                              OUT: {new Date(record.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-right">
                            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 animate-pulse flex items-center justify-end gap-1.5">
                              Currently Inside
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            </div>
                            <div className="px-4 py-2 bg-emerald-500/10 rounded-xl text-[11px] font-black text-emerald-500 border border-emerald-500/20 uppercase tracking-widest">
                              Active Session
                            </div>
                          </div>
                        )}
                        {!record.checkOutTime && (
                          <button 
                            onClick={() => setRescueTarget(record)}
                            className="w-10 h-10 flex items-center justify-center bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/10"
                            title="Force Checkout (Rescue)"
                          >
                            <Zap size={18} fill="currentColor" />
                          </button>
                        )}
                        <button className="w-10 h-10 flex items-center justify-center bg-white/[0.03] rounded-xl text-zinc-600 hover:text-white transition-colors">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredRecords.length === 0 && (
                  <div className="h-64 flex flex-col items-center justify-center text-zinc-700 space-y-4">
                    <Activity className="w-12 h-12 opacity-20" />
                    <p className="text-[11px] font-black uppercase tracking-[0.3em]">No attendance records found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR ANALYTICS */}
        <div className="space-y-8">
          {/* TRENDS PANEL */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight leading-none uppercase italic">Attendance Velocity</h3>
                <p className="text-zinc-500 text-[10px] mt-2 font-black uppercase tracking-[0.2em]">7-Day Snapshot</p>
              </div>
              <BarChart3 className="w-6 h-6 text-zinc-600" />
            </div>

            <div className="space-y-6">
              {trends.map((day, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{day.date}</span>
                    <span className="text-[11px] font-black text-white">{day.count} records</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (day.count / 20) * 100)}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INSIGHTS PANEL */}
          <div className="group bg-blue-600 rounded-[40px] p-8 shadow-[0_24px_50px_rgba(37,99,235,0.3)] relative overflow-hidden transition-all hover:scale-[1.02]">
            <div className="relative z-10">
              <Activity className="w-10 h-10 text-white mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-tight">Library<br />Usage</h3>
              <p className="text-blue-100/60 text-[11px] mt-4 font-bold uppercase tracking-widest leading-loose">
                Peak usage detected between 1 PM - 4 PM. Library capacity remaining: 82%.
              </p>
            </div>
            {/* DECORATION */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {rescueTarget && (
          <RescueCheckoutModal 
            record={rescueTarget} 
            onClose={() => setRescueTarget(null)} 
            onConfirm={(time) => {
              dispatch(forceAdminCheckout({ 
                attendanceId: rescueTarget.id, 
                checkOutTime: time,
                selectedDate,
                isTodaySelected,
              })).unwrap()
                .then(() => {
                  toast.success("Checkout protocol executed successfully.");
                  setRescueTarget(null);
                })
                .catch((err) => toast.error(err));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const RescueCheckoutModal = ({ record, onClose, onConfirm }) => {
  const [targetTime, setTargetTime] = useState(() => {
    // Default to current time, but formatted for input
    const now = new Date();
    return now.toTimeString().slice(0, 5); 
  });

  const handleCommit = () => {
    // Combine record date with target time
    const date = new Date(record.date);
    const [hrs, mins] = targetTime.split(':');
    date.setHours(parseInt(hrs), parseInt(mins), 0, 0);
    
    onConfirm(date.toISOString());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Zap size={24} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Rescue System</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Manual Checkout Protocol</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-zinc-900/50 rounded-3xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Target Student</span>
              <span className="text-sm font-black text-white italic uppercase">{record.student?.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Check-in Time</span>
              <span className="text-sm font-black text-blue-500 italic uppercase">
                {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] ml-2">Final Checkout Time</label>
            <div className="relative group">
              <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 group-focus-within:scale-110 transition-transform" />
              <input 
                type="time" 
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-[28px] py-5 pl-16 pr-8 text-xl font-black text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {[ "18:00", "20:00", "22:00" ].map(t => (
              <button 
                key={t}
                onClick={() => setTargetTime(t)}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-2xl text-[10px] font-black text-zinc-400 hover:text-white transition-all uppercase tracking-widest"
              >
                {t} PM
              </button>
            ))}
          </div>

          <div className="pt-4">
            <button 
              onClick={handleCommit}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-[0.3em] rounded-[28px] shadow-2xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <CheckCircle2 size={18} />
              Confirm Rescue
            </button>
            <p className="text-[9px] text-zinc-600 text-center mt-4 font-bold uppercase tracking-widest">This action will be logged in the permanent audit trail</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const FilterTab = ({ active, label, count, onClick, color }) => {
  const activeColors = {
    emerald: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
    amber: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20',
    default: 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
  };

  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${active
        ? (activeColors[color] || activeColors.default)
        : 'text-zinc-500 hover:text-white hover:bg-white/5'
        }`}
    >
      {label}
      <span className={`px-2 py-0.5 rounded-md text-[9px] ${active ? 'bg-white/20' : 'bg-zinc-800'}`}>
        {count}
      </span>
    </button>
  );
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const StatCard = ({ label, value, icon: Icon, trend, color, isInverse }) => {
  const colors = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5',
    indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/5',
  };

  return (
    <div className={`p-8 rounded-[40px] bg-zinc-900 border border-white/5 transition-all hover:bg-zinc-800/70 hover:scale-[1.02] shadow-2xl`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${colors[color]}`}>
          <Icon className="w-7 h-7" />
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${isInverse ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
          {trend.includes('%') && (isInverse ? <ArrowUpRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />)}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{label}</p>
        <span className="text-4xl font-black text-white tracking-tighter italic">{value}</span>
      </div>
    </div>
  );
};
