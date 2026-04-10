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
  ShieldCheck
} from 'lucide-react';
import { logoutAdmin } from '../store/slices/authSlice';
import { Scanner } from '@yudiel/react-qr-scanner';
import { 
  fetchTodayStatus, 
  fetchMetrics, 
  fetchHistory, 
  autoMarkAttendance,
  generateQR
} from '../store/slices/studentDashboardSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useSelector((state) => state.adminAuth);
  const { 
    todayStatus, 
    metrics, 
    history, 
    qrToken,
    loading, 
    actionLoading 
  } = useSelector((state) => state.studentDashboard);
  
  const [showQR, setShowQR] = React.useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchTodayStatus());
    dispatch(fetchMetrics());
    dispatch(fetchHistory());
  }, [dispatch]);

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
        
        {/* Header - Greeting & Quick Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-6">
            👋 Hello, {user?.name?.split(' ')[0]}
          </h1>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-orange-400 mb-1">
                <Flame size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Streak</span>
              </div>
              <span className="text-2xl font-bold text-white">
                {metrics?.currentStreak || 0} <span className="text-sm font-normal text-gray-400">days</span>
              </span>
            </div>
            <div className="glass-card p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <Clock size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Today</span>
              </div>
              <span className="text-2xl font-bold text-white">
                {todayStatus?.studyHours?.toFixed(1) || 0} <span className="text-sm font-normal text-gray-400">hrs</span>
              </span>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowQR(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-[#161B22] border border-white/10 p-8 rounded-[2rem] w-full max-w-sm shadow-2xl"
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">Scan Library Node</h3>
                  <p className="text-xs text-gray-400">Point your camera at the library checkout desk QR code to mark attendance</p>
                </div>

                <div className="bg-white/5 rounded-3xl mb-6 shadow-inner overflow-hidden flex items-center justify-center">
                  <div className="w-full h-[300px] bg-black">
                    <Scanner 
                      onScan={handleScanSuccess} 
                      onError={(err) => console.log(err)}
                      components={{
                        audio: false,
                        onOff: true,
                        finder: true
                      }}
                      styles={{ container: { width: '100%', height: '100%' } }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowQR(false)}
                  className="w-full py-4 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-400 transition-colors"
                >
                  Dismiss Camera
                </button>
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

        {/* Attendance History */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <History size={20} className="text-indigo-500" />
              📊 History
            </div>
            <span className="text-xs text-gray-500 font-semibold">{metrics?.totalDaysAttended} days total</span>
          </div>

          <div className="space-y-3">
            {loading && history.length === 0 ? (
              <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No recent attendance found.</div>
            ) : (
              history.map((record) => (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  key={record.id} 
                  className="glass-card p-4 rounded-2xl border border-white/5 flex items-center justify-between"
                >
                  <div>
                    <div className="text-white font-bold mb-1">{formatDate(record.date)}</div>
                    <div className="text-xs text-gray-400">
                      {formatTime(record.checkInTime)} - {formatTime(record.checkOutTime)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-blue-400 font-bold">{record.studyHours?.toFixed(1)}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Hours</div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

      </main>
    </div>
  );
}
