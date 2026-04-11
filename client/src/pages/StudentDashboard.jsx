import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  Camera,
  Flame,
  Clock,
  Calendar,
  History,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  GraduationCap,
  ShieldCheck,
  Trophy,
  Target,
  PenLine,
  ChevronRight,
  TrendingUp,
  Award,
  Settings
} from 'lucide-react';
import { logoutAdmin } from '../store/slices/authSlice';
import { Scanner } from '@yudiel/react-qr-scanner';
import {
  fetchTodayStatus,
  fetchMetrics,
  fetchHistory,
  autoMarkAttendance,
  generateQR,
  updateDailyGoal,
  fetchLeaderboard,
  fetchStudyLogs,
  createStudyLog
} from '../store/slices/studentDashboardSlice';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useSelector((state) => state.adminAuth);
  const {
    todayStatus,
    metrics,
    history,
    leaderboard,
    studyLogs,
    qrToken,
    loading,
    actionLoading
  } = useSelector((state) => state.studentDashboard);

  const [showQR, setShowQR] = React.useState(false);
  const [showLeaderboard, setShowLeaderboard] = React.useState(false);
  const [showLogModal, setShowLogModal] = React.useState(false);
  const [showGoalModal, setShowGoalModal] = React.useState(false);
  const [chartRange, setChartRange] = React.useState('week'); // 'week' | 'month' | 'year'
  const [tempGoal, setTempGoal] = React.useState(metrics?.dailyGoalHours || 8);
  const [logFormData, setLogFormData] = React.useState({
    subject: '',
    topicsCovered: '',
    hoursSpent: todayStatus?.studyHours?.toFixed(1) || 0,
    productivityRating: 5
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchTodayStatus());
    dispatch(fetchMetrics());
    dispatch(fetchHistory());
    dispatch(fetchLeaderboard());
    dispatch(fetchStudyLogs());
  }, [dispatch]);

  const handleUpdateGoal = async () => {
    try {
      await dispatch(updateDailyGoal(tempGoal)).unwrap();
      setShowGoalModal(false);
      toast.success("Focus target recalibrated.");
    } catch (err) {
      toast.error("Failed to update goal");
    }
  };

  const handleCreateLog = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createStudyLog(logFormData)).unwrap();
      setShowLogModal(false);
      setLogFormData({ subject: '', topicsCovered: '', hoursSpent: 0, productivityRating: 5 });
      toast.success("Session preserved in journals.");
    } catch (err) {
      toast.error("Failed to save log");
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutAdmin()).unwrap();
      toast.success("Disconnected. Session closed.");
      navigate('/login');
    } catch (err) {
      toast.error("Disconnection Failed");
    }
  };

  const handleShowQR = () => {
    setShowQR(true);
  };

  const handleScanSuccess = async (result) => {
    if (!result || !result[0]) return;
    const qrValue = result[0].rawValue;

    setShowQR(false);
    try {
      // In a real app, you would pass `qrToken: qrValue` to the API.
      // E.g. dispatch(autoMarkAttendance(qrValue))
      // Since our current autoMarkAttendance thunk uses an internally stored generation logic from attendanceApi before, we actually need to change autoMarkAttendance in slices, but for now we can just dispatch an action. Wait, I should import and call the direct API or update the Slice.
      // Let's just dispatch the action. I'll need to update autoMarkAttendance to take the token!
      await dispatch(autoMarkAttendance(qrValue)).unwrap();
      toast.success("Attendance Updated!");
      dispatch(fetchTodayStatus());
      dispatch(fetchMetrics());
      dispatch(fetchHistory());
    } catch (err) {
      toast.error(typeof err === 'string' ? err : "Failed to mark attendance");
    }
  };

  const getProcessedChartData = () => {
    if (!history) return [];

    if (chartRange === 'week') {
      return [...history].slice(0, 7).reverse();
    }

    if (chartRange === 'month') {
      return [...history].slice(0, 30).reverse();
    }

    if (chartRange === 'year') {
      // Aggregate by month for the last 12 months
      const monthlyData = {};
      const now = new Date();

      // Initialize last 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString('default', { month: 'short' });
        monthlyData[key] = { label: key, studyHours: 0 };
      }

      history.forEach(record => {
        const d = new Date(record.date);
        const key = d.toLocaleString('default', { month: 'short' });
        if (monthlyData[key]) {
          monthlyData[key].studyHours += (record.studyHours || 0);
        }
      });

      return Object.values(monthlyData);
    }

    return [];
  };

  const getRangeLabel = (val) => {
    if (chartRange === 'year') return val;
    const date = new Date(val);
    if (chartRange === 'month') return date.getDate();
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#0B0D17] text-gray-300 font-sans selection:bg-blue-500/30 overflow-x-hidden pb-20">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5 bg-[#0B0D17]/50 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <GraduationCap size={18} />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Student<span className="text-blue-500">Panel</span></span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* HEADER SECTION (Full Width) */}
          <div className="lg:col-span-12 mb-4">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tighter">
                    Hub Node:<br />
                    <span className="text-blue-500">{user?.name?.split(' ')[0] || 'Member'}</span>
                  </h1>
                  <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Productivity Sync Active
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* LEFT COLUMN: PRIMARY DYNAMIC ACTIONS (Scanner prioritized) */}
          <div className="lg:col-span-12 xl:col-span-4 space-y-8 order-2 xl:order-1">

            {/* EXCELLENCE HUB (Ranks & Streak) - POSITION #1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-between shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-lg shadow-orange-500/5">
                  <Flame size={24} className="animate-pulse" />
                </div>
                <div>
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Current Velocity</span>
                  <span className="text-xl font-black text-white tracking-tighter">{metrics?.currentStreak || 0} DAY STREAK</span>
                </div>
              </div>

              <button
                onClick={() => setShowLeaderboard(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all hover:scale-105 active:scale-95 shadow-lg group"
              >
                <Trophy size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="text-xs font-black tracking-tighter uppercase">Global Ranks</span>
              </button>
            </motion.div>

            {/* VIRTUAL CHECKPOINT SCANNER (The Master Action) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              className="relative"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.3em] z-20 shadow-xl border border-blue-400/30">
                Hub Entry Terminal
              </div>

              <button
                onClick={handleShowQR}
                disabled={todayStatus?.status === 'Completed' || actionLoading}
                className={`group relative w-full rounded-[3rem] overflow-hidden transition-all duration-700 active:scale-[0.96] border-4 ${todayStatus?.status === 'Completed'
                    ? 'border-white/5 opacity-50 grayscale cursor-not-allowed'
                    : todayStatus?.status === 'In Library'
                      ? 'border-orange-500/20 shadow-2xl shadow-orange-500/10'
                      : 'border-blue-500/20 shadow-2xl shadow-blue-500/10'
                  }`}
              >
                <div className={`absolute inset-0 transition-all duration-700 ${todayStatus?.status === 'Completed'
                    ? 'bg-zinc-900'
                    : todayStatus?.status === 'In Library'
                      ? 'bg-gradient-to-br from-orange-600 to-rose-700 group-hover:opacity-90'
                      : 'bg-gradient-to-br from-blue-600 to-indigo-700 group-hover:opacity-90'
                  }`} />

                <div className="relative p-12 flex flex-col items-center justify-center gap-4 text-center">
                  {actionLoading ? (
                    <Loader2 size={64} className="animate-spin text-white/50" />
                  ) : todayStatus?.status === 'Completed' ? (
                    <>
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-2">
                        <CheckCircle2 size={48} className="text-gray-500" />
                      </div>
                      <div>
                        <span className="text-2xl font-black text-white tracking-tighter block uppercase">Quota Reached</span>
                        <span className="text-[10px] text-gray-400 font-black tracking-widest uppercase mt-2">Next Sync: 00:00 UTC</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-2 relative ${todayStatus?.status === 'In Library' ? 'bg-white/20' : 'bg-white/20'
                        }`}>
                        <Camera size={56} className="text-white group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping opacity-20" />
                      </div>
                      <div>
                        <span className="text-3xl font-black text-white tracking-tighter block uppercase">
                          {todayStatus?.status === 'In Library' ? 'LOG CHECK-OUT' : 'ACTIVATE SHIFT'}
                        </span>
                        <p className="text-[10px] text-white/70 font-bold uppercase tracking-[0.2em] mt-3">
                          {todayStatus?.status === 'In Library' ? 'Egress Terminal Ready' : 'Ingress Authentication Required'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </button>
            </motion.div>

            {/* Productivity Circle Widget */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 rounded-[3rem] bg-gradient-to-br from-blue-600/5 to-transparent border border-white/5 relative overflow-hidden group shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target size={120} />
              </div>

              <div className="flex flex-col items-center">
                <div className="w-48 h-48 relative mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: Math.min(todayStatus?.studyHours || 0, metrics?.dailyGoalHours || 8) },
                          { name: 'Remaining', value: Math.max((metrics?.dailyGoalHours || 8) - (todayStatus?.studyHours || 0), 0) }
                        ]}
                        innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none"
                      >
                        <Cell fill="#3B82F6" />
                        <Cell fill="rgba(255,255,255,0.03)" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white tracking-tighter">
                      {Math.round(((todayStatus?.studyHours || 0) / (metrics?.dailyGoalHours || 8)) * 100)}%
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Goal Sync</span>
                  </div>
                </div>

                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.03] border border-white/5">
                    <div>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Target Hours</span>
                      <span className="text-2xl font-black text-white tracking-tighter">{metrics?.dailyGoalHours || 8}H</span>
                    </div>
                    <button
                      onClick={() => { setTempGoal(metrics?.dailyGoalHours || 8); setShowGoalModal(true); }}
                      className="p-4 bg-blue-600/10 text-blue-500 rounded-2xl hover:bg-blue-600/20 transition-all active:scale-90"
                    >
                      <Settings size={22} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.03] border border-white/5">
                    <div>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Actual Focus</span>
                      <span className="text-2xl font-black text-blue-500 tracking-tighter">{todayStatus?.studyHours?.toFixed(1) || 0}H</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-500">
                      <Clock size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions Journal Trigger */}
            <div className="space-y-4">
              <button
                onClick={() => setShowLogModal(true)}
                className="w-full py-6 rounded-3xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.3em]"
              >
                <PenLine size={20} />
                Preserve Study Journal
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: ANALYTICS, JOURNALS & HISTORY */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <TrendingUp size={20} />
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">Performance Artifacts</h2>
                </div>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
                  {['week', 'month', 'year'].map((range) => (
                    <button
                      key={range} onClick={() => setChartRange(range)}
                      className={`px-3 sm:px-5 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${chartRange === range ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-[2.5rem] sm:rounded-[3rem] p-4 sm:p-8 border border-white/5 h-[280px] md:h-[350px] shadow-2xl relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getProcessedChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis
                      dataKey={chartRange === 'year' ? 'label' : 'date'} axisLine={false} tickLine={false}
                      tick={{ fill: '#4B5563', fontSize: 9, fontWeight: '800' }} tickFormatter={getRangeLabel}
                      dy={10}
                    />
                    <YAxis hide domain={[0, 'auto']} />
                    <ReTooltip
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      contentStyle={{ backgroundColor: '#0c0c0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '12px', fontSize: '10px' }}
                      labelFormatter={(val) => chartRange === 'year' ? val : new Date(val).toLocaleDateString()}
                    />
                    <Bar dataKey="studyHours" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={chartRange === 'week' ? 25 : chartRange === 'month' ? 8 : 20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Recent Journals */}
            {studyLogs.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <History size={20} />
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">Journal Chronology</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {studyLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="glass-card p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-lg">
                          {log.subject}
                        </div>
                        <span className="text-[10px] text-gray-600 font-bold">{formatDate(log.date)}</span>
                      </div>
                      <p className="text-gray-300 text-sm font-medium leading-relaxed italic mb-4">"{log.topicsCovered}"</p>
                      <div className="flex items-center gap-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {log.hoursSpent}H Focus</span>
                        <span className="flex items-center gap-1.5"><Award size={12} /> {log.productivityRating}/5 Rating</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Archive / History */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-500/10 flex items-center justify-center text-gray-500">
                    <Calendar size={20} />
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">Full Registry</h2>
                </div>
                <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{metrics?.totalDaysAttended} Logs</span>
              </div>
              <div className="space-y-3">
                {history.slice(0, 5).map((record) => (
                  <div key={record.id} className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between hover:bg-white/[0.04] transition-all group">
                    <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">{formatDate(record.date)}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-blue-500">{record.studyHours?.toFixed(1)}H</span>
                      <ChevronRight size={16} className="text-gray-700" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* --- MODALS SECTION --- */}

        {/* QR Scanner Modal */}
        <AnimatePresence>
          {showQR && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQR(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-zinc-900 border border-white/10 p-8 rounded-[3rem] w-full max-w-sm shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-white">Registry Auth</h3>
                  <button onClick={() => setShowQR(false)} className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-white"><XCircle size={20} /></button>
                </div>
                <div className="bg-black/50 rounded-[2rem] mb-6 overflow-hidden border border-white/5 h-[300px] relative">
                  <Scanner onScan={handleScanSuccess} components={{ audio: false, finder: true }} styles={{ container: { width: '100%', height: '100%' } }} />
                </div>
                <button onClick={() => setShowQR(false)} className="w-full py-4 rounded-2xl bg-white/5 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:bg-white/10">Terminate Node</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Leaderboard Modal */}
        <AnimatePresence>
          {showLeaderboard && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLeaderboard(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                className="relative bg-[#0c0c0e] border-t sm:border border-white/10 p-8 sm:p-10 rounded-t-[4rem] sm:rounded-[4rem] w-full max-w-lg h-[90vh] sm:h-[80vh] flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between mb-10 shrink-0">
                  <h3 className="text-3xl font-black text-white tracking-tighter italic">Wall of <span className="text-blue-500">Excellence</span></h3>
                  <button onClick={() => setShowLeaderboard(false)} className="p-4 rounded-2xl bg-white/5 text-gray-500 hover:text-white transition-all"><XCircle size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-10">
                  {leaderboard.map((item, index) => (
                    <div key={item.id} className={`flex items-center gap-5 p-6 rounded-[2.5rem] border transition-all ${index < 1 ? 'bg-blue-600/10 border-blue-500/20' : 'bg-white/[0.02] border-white/5'}`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl ${index === 0 ? 'bg-orange-500 text-white' : index === 1 ? 'bg-slate-400 text-white' : index === 2 ? 'bg-amber-600 text-white' : 'bg-white/10 text-gray-600'}`}>{index + 1}</div>
                      <div className="flex-1">
                        <div className="text-lg font-black text-white tracking-tight leading-none">{item.fullName}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Flame size={14} className="text-orange-500" />
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.currentStreak} Day Streak</span>
                        </div>
                      </div>
                      {index < 3 && <Award size={28} className={index === 0 ? 'text-orange-400' : index === 1 ? 'text-slate-300' : 'text-amber-500'} />}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Goal Modal */}
        <AnimatePresence>
          {showGoalModal && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGoalModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-zinc-900 border border-white/10 p-8 rounded-[3rem] w-full max-w-sm overflow-hidden"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-white">Target</h3>
                  <button onClick={() => setShowGoalModal(false)} className="p-2 rounded-xl bg-white/5 text-gray-500"><XCircle size={20} /></button>
                </div>
                <div className="space-y-8">
                  <div className="grid grid-cols-4 gap-2">
                    {[6, 8, 10, 12].map(hrs => (
                      <button key={hrs} onClick={() => setTempGoal(hrs)} className={`py-4 rounded-2xl text-xs font-black border transition-all ${Number(tempGoal) === hrs ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-gray-500'}`}>{hrs}H</button>
                    ))}
                  </div>
                  <input type="number" value={tempGoal} onChange={(e) => setTempGoal(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-3xl font-black text-center text-white focus:border-blue-500 outline-none" />
                  <div className="flex gap-3">
                    <button onClick={() => setShowGoalModal(false)} className="flex-1 py-5 bg-white/5 text-gray-500 font-bold rounded-2xl">Cancel</button>
                    <button onClick={handleUpdateGoal} className="flex-2 px-8 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20">Save</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Study Log Modal */}
        <AnimatePresence>
          {showLogModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLogModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-zinc-900 border border-white/10 p-10 rounded-[4rem] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="flex items-center justify-between mb-10 shrink-0">
                  <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter">Daily Journal</h2>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Preserving focus nodes</p>
                  </div>
                  <button onClick={() => setShowLogModal(false)} className="p-4 rounded-2xl bg-white/5 text-gray-400 hover:text-white transition-all"><XCircle size={24} /></button>
                </div>

                <form onSubmit={handleCreateLog} className="space-y-8 overflow-y-auto pr-2 custom-scrollbar pb-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Primary Node</label>
                    <input type="text" placeholder="e.g., UPSC GS-II Synthesis" value={logFormData.subject} onChange={(e) => setLogFormData({ ...logFormData, subject: e.target.value })}
                      className="w-full bg-white/5 border border-white/5 rounded-3xl p-5 text-sm font-bold text-white focus:border-blue-500 outline-none transition-all placeholder:text-gray-700" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Core Synthesis</label>
                    <textarea placeholder="List major breakthroughs..." value={logFormData.topicsCovered} onChange={(e) => setLogFormData({ ...logFormData, topicsCovered: e.target.value })}
                      className="w-full bg-white/5 border border-white/5 rounded-3xl p-6 text-sm font-medium text-white focus:border-blue-500 outline-none transition-all h-40 resize-none placeholder:text-gray-700" required />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Focus Time (H)</label>
                      <input type="number" step="0.1" value={logFormData.hoursSpent} onChange={(e) => setLogFormData({ ...logFormData, hoursSpent: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-3xl p-5 text-sm font-black text-white focus:border-blue-500 outline-none" required />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Sync Tier</label>
                      <select value={logFormData.productivityRating} onChange={(e) => setLogFormData({ ...logFormData, productivityRating: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-3xl p-5 text-sm font-black text-white focus:border-blue-500 outline-none appearance-none">
                        {[5, 4, 3, 2, 1].map(r => <option key={r} value={r} className="bg-zinc-900">{r}/5 Performance</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[30px] shadow-2xl shadow-blue-500/30 active:scale-[0.98] transition-all mt-4"> Secure Node in History </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
