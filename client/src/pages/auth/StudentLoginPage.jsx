import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Lock, Loader2, ArrowRight, 
  AlertCircle, GraduationCap, LayoutGrid 
} from 'lucide-react';
import { loginAdmin, clearError } from '../../store/slices/authSlice'; // Re-using same slice for now
import toast from 'react-hot-toast';

export default function StudentLoginPage() {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.adminAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    
    try {
      const resultAction = await dispatch(loginAdmin({ credential, password }));
      if (loginAdmin.fulfilled.match(resultAction)) {
        const { accessToken, user } = resultAction.payload;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        toast.success("Welcome back! Loading your profile...");
        navigate('/student/portal'); 
      }
    } catch (err) {
      toast.error("Login Failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D17] flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Student Theme Background */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[130px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[130px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg md:max-w-xl z-10"
      >
        <div className="glass-card p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] relative">
          <div className="flex flex-col md:flex-row gap-8 md:gap-10">
            <div className="flex-1">
              <div className="mb-8 text-center md:text-left">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 mx-auto md:mx-0">
                  <GraduationCap size={32} />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Student Portal</h1>
                <p className="text-gray-400 text-sm">Access your attendance records & library identity.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm"
                    >
                      <AlertCircle size={18} />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4 text-left">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center text-gray-400 pointer-events-none">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="text" 
                      value={credential}
                      onChange={(e) => setCredential(e.target.value)}
                      placeholder="Email or Mobile"
                      className="w-full bg-[#161B22]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:bg-[#161B22] transition-all"
                      required
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center text-gray-400 pointer-events-none">
                      <Lock size={18} />
                    </div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-[#161B22]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:bg-[#161B22] transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 px-1">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0 transition-all" />
                      <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">Remember Node</span>
                    </label>
                    <Link to="/forgot-password" size="sm" className="text-xs text-blue-400 hover:text-blue-300 transition-colors underline-offset-4 hover:underline">Issue Recovery?</Link>
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all group shadow-lg shadow-blue-500/20"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-4">
                <p className="text-sm text-gray-500">
                  New to Librync? <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors font-semibold underline-offset-4 hover:underline">Register Identity</Link>
                </p>
                <Link to="/admin/login" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-600 hover:text-emerald-400 transition-all font-bold">
                  <LayoutGrid size={14} />
                  Access Admin Node
                </Link>
              </div>
            </div>

            <div className="hidden md:flex flex-col justify-center items-center w-40 border-l border-white/5 pl-10">
              <div className="space-y-8 text-center">
                <div>
                  <div className="text-2xl font-bold text-white tracking-tight">2.4k+</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">Daily Logins</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white tracking-tight">99.9%</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">Uptime Node</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
