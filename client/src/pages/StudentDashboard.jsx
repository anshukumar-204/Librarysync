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
  const [isEditingGoal, setIsEditingGoal] = React.useState(false);
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
      setIsEditingGoal(false);
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
      <nav className="relative z-10 border-b border-white/5 bg-[#0B0D17]/50 backdrop-blur-xl">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
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

      <main className="relative z-10 max-w-md mx-auto px-4 pt-8">
        
        {/* Header - Greeting & Productivity Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-black text-white leading-tight">
                Hub Node:<br/>
                <span className="text-blue-500">{user?.name?.split(' ')[0]}</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Productivity Sync Active
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">
                <Flame size={14} className="animate-bounce" />
                <span className="text-xs font-black tracking-tighter">{metrics?.currentStreak || 0} DAY STREAK</span>
              </div>
              <button 
                onClick={() => setShowLeaderboard(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all"
              >
                <Trophy size={14} />
                <span className="text-xs font-black tracking-tighter">LEADERBOARD</span>
              </button>
            </div>
          </div>

          {/* Productivity Circle & Major Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-[2.5rem] bg-gradient-to-br from-blue-600/5 to-transparent border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target size={80} />
              </div>
              
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: Math.min(todayStatus?.studyHours || 0, metrics?.dailyGoalHours || 8) },
                          { name: 'Remaining', value: Math.max((metrics?.dailyGoalHours || 8) - (todayStatus?.studyHours || 0), 0) }
                        ]}
                        innerRadius={35}
                        outerRadius={45}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill="#3B82F6" />
                        <Cell fill="rgba(255,255,255,0.05)" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-black text-white">
                      {Math.round(((todayStatus?.studyHours || 0) / (metrics?.dailyGoalHours || 8)) * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Daily Focus Goal</span>
                    <button 
                      onClick={() => { setTempGoal(metrics?.dailyGoalHours || 8); setIsEditingGoal(true); }}
                      className="text-blue-500 hover:text-blue-400 transition-colors"
                    >
                      <Settings size={14} />
                    </button>
                  </div>
                  {isEditingGoal ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" value={tempGoal} onChange={(e) => setTempGoal(e.target.value)}
                        className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-blue-500"
                      />
                      <button onClick={handleUpdateGoal} className="bg-blue-600 text-white p-1 rounded-lg hover:bg-blue-500"><CheckCircle2 size={16}/></button>
                      <button onClick={() => setIsEditingGoal(false)} className="bg-white/5 text-gray-400 p-1 rounded-lg hover:text-white"><XCircle size={16}/></button>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-black text-white tracking-tighter">
                        {todayStatus?.studyHours?.toFixed(1) || 0} / {metrics?.dailyGoalHours || 8} <span className="text-xs font-medium text-gray-500 tracking-normal">HRS</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Keep pushing to hit your peak state.</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col justify-between">
                <TrendingUp size={18} className="text-emerald-500 mb-2" />
                <div>
                  <div className="text-[9px] font-black text-emerald-500/70 uppercase tracking-[0.2em] mb-1">Efficiency</div>
                  <div className="text-xl font-black text-white tracking-tighter">High Tier</div>
                </div>
              </div>
              <div className="glass-card p-4 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col justify-between cursor-pointer hover:bg-indigo-500/10 transition-colors"
                onClick={() => setShowLogModal(true)}>
                <PenLine size={18} className="text-indigo-500 mb-2" />
                <div>
                  <div className="text-[9px] font-black text-indigo-500/70 uppercase tracking-[0.2em] mb-1">Logs</div>
                  <div className="text-xl font-black text-white tracking-tighter flex items-center gap-2">
                    Journal <ChevronRight size={14} strokeWidth={3} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Primary Action - Scan / Show QR */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-10 space-y-4"
        >
          <button
            onClick={handleShowQR}
            disabled={actionLoading || todayStatus?.status === 'Completed'}
            className="w-full relative group overflow-hidden rounded-3xl"
          >
            <div className={`absolute inset-0 transition-opacity duration-300 ${
              todayStatus?.status === 'Completed' ? 'bg-gray-800' : 'bg-gradient-to-r from-blue-500 to-indigo-500 group-hover:opacity-90'
            }`} />
            
            <div className="relative p-6 flex flex-col items-center justify-center gap-3">
              {actionLoading && !showQR ? (
                <Loader2 size={48} className="animate-spin text-white/50" />
              ) : todayStatus?.status === 'Completed' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-400 mb-2">
                    <CheckCircle2 size={32} />
                  </div>
                  <span className="text-xl font-bold text-gray-400">Done for Today</span>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white mb-2 shadow-inner group-hover:scale-110 transition-transform">
                    <Camera size={32} />
                  </div>
                  <span className="text-xl font-bold text-white tracking-tight">
                    {todayStatus?.status === 'In Library' ? 'Scan to Check-out' : 'Scan to Check-in'}
                  </span>
                  <span className="text-xs text-white/70">One-tap auto mark</span>
                </>
              )}
            </div>
          </button>

          <button
            onClick={handleShowQR}
            className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2 font-semibold"
          >
            <ShieldCheck size={18} />
            Scan via Camera
          </button>
        </motion.div>

        {/* QR Code Modal Overlay */}
        <AnimatePresence>
          {showQR && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowQR(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-zinc-900 border border-white/10 p-8 rounded-[3rem] w-full max-w-sm shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Registry Authentication</h3>
                  <p className="text-xs text-gray-500">Scan library node to verify presence</p>
                </div>

                <div className="bg-black/50 rounded-3xl mb-6 shadow-inner overflow-hidden border border-white/5 h-[300px]">
                  <Scanner 
                    onScan={handleScanSuccess} 
                    onError={(err) => console.log(err)}
                    components={{ audio: false, onOff: true, finder: true }}
                    styles={{ container: { width: '100%', height: '100%' } }}
                  />
                </div>

                <button
                  onClick={() => setShowQR(false)}
                  className="w-full py-4 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition-all border border-white/5"
                >
                  Terminate Scanner
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Leaderboard Modal */}
        <AnimatePresence>
          {showLeaderboard && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowLeaderboard(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />
              <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                className="relative bg-[#0c0c0e] border-t sm:border border-white/10 p-6 sm:p-10 rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-lg h-[90vh] sm:h-[80vh] flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between mb-8 shrink-0">
                  <h3 className="text-2xl font-black text-white tracking-tight">Wall of <span className="text-blue-500">Excellence</span></h3>
                  <button onClick={() => setShowLeaderboard(false)} className="p-3 rounded-2xl bg-white/5 text-gray-400"><XCircle size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                  {leaderboard.map((item, index) => (
                    <div key={item.id} className={`flex items-center gap-4 p-5 rounded-3xl border transition-all ${index < 3 ? 'bg-blue-600/10 border-blue-500/20 shadow-lg shadow-blue-500/10 scale-[1.02]' : 'bg-white/5 border-white/5'}`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg ${index === 0 ? 'bg-orange-500 text-white' : index === 1 ? 'bg-slate-400 text-white' : index === 2 ? 'bg-amber-600 text-white' : 'bg-white/10 text-gray-500'}`}>
                        {index + 1}
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 overflow-hidden shrink-0">
                         {item.profileImage ? <img src={item.profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-blue-500 font-bold">{item.fullName?.[0]}</div>}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-black text-white tracking-tight">{item.fullName}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                          <Flame size={12} className="text-orange-500" />
                          {item.currentStreak} Day Streak
                        </div>
                      </div>
                      {index < 3 && <Award size={24} className={index === 0 ? 'text-orange-400' : index === 1 ? 'text-slate-300' : 'text-amber-500'} />}
                    </div>
                  ))}
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
                className="relative bg-zinc-900 border border-white/10 p-8 rounded-[3rem] w-full max-w-md overflow-hidden"
              >
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-white">Daily Journal</h3>
                  <p className="text-xs text-gray-500 mt-2">Log your technical breakthroughs and focus nodes for today.</p>
                </div>
                <form onSubmit={handleCreateLog} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Primary Focus Area</label>
                    <input type="text" placeholder="e.g., UPSC GS-II / SSC Quant" value={logFormData.subject} onChange={(e) => setLogFormData({...logFormData, subject: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-blue-500 outline-none transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Key Topics Synthesized</label>
                    <textarea placeholder="List major concepts covered..." value={logFormData.topicsCovered} onChange={(e) => setLogFormData({...logFormData, topicsCovered: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-blue-500 outline-none transition-all h-32 resize-none" required />
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="flex-1 space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Hours Logged</label>
                        <input type="number" step="0.1" value={logFormData.hoursSpent} onChange={(e) => setLogFormData({...logFormData, hoursSpent: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-blue-500 outline-none" required />
                     </div>
                     <div className="flex-1 space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Productivity Range</label>
                        <select value={logFormData.productivityRating} onChange={(e) => setLogFormData({...logFormData, productivityRating: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-blue-500 outline-none appearance-none">
                            {[1, 2, 3, 4, 5].map(r => <option key={r} value={r} className="bg-zinc-900">{r}/5 State</option>)}
                        </select>
                     </div>
                  </div>
                  <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-2xl shadow-blue-500/20 active:scale-95 transition-all"> Preserve Log Entry </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Divider */}
        <div className="w-full h-[1px] bg-white/10 mb-8" />

        {/* Today Status Widget */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 text-white font-bold text-lg mb-4">
            <Calendar size={20} className="text-blue-500" />
            📅 Today Status
          </div>
          
          <div className="glass-card rounded-3xl p-5 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-400">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={16} />
                </div>
                <span className="font-semibold text-sm uppercase tracking-widest">Check-in</span>
              </div>
              <span className="text-white font-bold">{formatTime(todayStatus?.checkIn)}</span>
            </div>
            
            <div className="w-full h-[1px] bg-white/5" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-400">
                <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <XCircle size={16} />
                </div>
                <span className="font-semibold text-sm uppercase tracking-widest">Check-out</span>
              </div>
              <span className="text-white font-bold">{formatTime(todayStatus?.checkOut)}</span>
            </div>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-white/10 mb-8" />
        
        {/* Study Analytics Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 text-white font-black text-lg mb-6">
            <TrendingUp size={20} className="text-blue-500" />
            Performance Nodes
          </div>
          
          <div className="glass-card rounded-[2rem] p-6 border border-white/5 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history.slice(0, 7).reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 'bold' }} 
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {weekday: 'short'})} 
                />
                <YAxis hide />
                <ReTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                />
                <Bar dataKey="studyHours" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Study Journals / Recent Logs */}
        {studyLogs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 text-white font-black text-lg mb-4">
              <History size={20} className="text-indigo-500" />
              Journal Artifacts
            </div>
            
            <div className="space-y-4">
              {studyLogs.slice(0, 3).map((log) => (
                <div key={log.id} className="glass-card p-5 rounded-3xl border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-5">
                    <History size={40} />
                  </div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-widest rounded-lg">
                      {log.subject}
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold">{formatDate(log.date)}</span>
                  </div>
                  <p className="text-gray-300 text-sm font-medium line-clamp-2 leading-relaxed italic">"{log.topicsCovered}"</p>
                  <div className="flex items-center gap-4 mt-4 text-[10px] font-bold text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={12}/> {log.hoursSpent} Hrs</span>
                    <span className="flex items-center gap-1"><Award size={12}/> {log.productivityRating}/5 Rating</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Attendance History (Simplified) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Full Archive Registry</div>
            <span className="text-[9px] text-gray-600 font-bold">{metrics?.totalDaysAttended} NODES STORED</span>
          </div>
          <div className="space-y-3">
             {history.slice(0, 5).map((record) => (
                <div key={record.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
                  <div className="text-xs font-bold text-white">{formatDate(record.date)}</div>
                  <div className="text-[10px] font-black text-blue-500/80">{record.studyHours?.toFixed(1)} HRS</div>
                </div>
             ))}
          </div>
        </motion.div>

      </main>
    </div>
  );
}
