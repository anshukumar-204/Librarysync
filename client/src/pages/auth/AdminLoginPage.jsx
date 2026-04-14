import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogIn, Mail, Lock, Loader2, ShieldCheck, 
  ArrowRight, AlertCircle, Sparkles, Eye, EyeOff 
} from 'lucide-react';
import { loginAdmin, verifyLoginOtpAdmin, clearError } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [loginId, setLoginId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.adminAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    setIsSubmitting(true);
    try {
      const resultAction = await dispatch(loginAdmin({ credential, password }));
      if (loginAdmin.fulfilled.match(resultAction)) {
        if (resultAction.payload.requiresOtp) {
          setLoginId(resultAction.payload.loginId);
          setShowOtp(true);
          toast.success('Security code sent to your registered email address.');
        } else {
          toast.success('Access granted. Opening Admin Dashboard...');
          navigate('/admin/dashboard');
        }
      } else {
        toast.error(resultAction.payload || 'Login failed. Check your credentials.');
      }
    } catch {
      toast.error('Unable to connect to the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    setIsSubmitting(true);
    try {
      const resultAction = await dispatch(verifyLoginOtpAdmin({ loginId, otp }));
      if (verifyLoginOtpAdmin.fulfilled.match(resultAction)) {
        toast.success('Identity confirmed. Welcome, Admin!');
        navigate('/admin/dashboard');
      } else {
        toast.error(resultAction.payload || 'Security code is incorrect or has expired.');
      }
    } catch {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D17] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="glass-card p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="text-center mb-10 relative">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6 text-emerald-400"
            >
              <ShieldCheck size={42} strokeWidth={1.5} />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Admin Portal</h1>
            <p className="text-gray-400 text-sm">Secure Administrator Access</p>
          </div>

          {!showOtp ? (
            <form onSubmit={handleSubmit} className="space-y-6 relative">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm"
                  >
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Admin Email</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-4 flex items-center text-gray-400 group-focus-within/input:text-emerald-400 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    placeholder="Email Address"
                    className="w-full bg-[#161B22]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-[#161B22] transition-all duration-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Account Password</label>
                  <Link to="/forgot-password" size="sm" className="text-xs text-gray-400 hover:text-emerald-400 transition-colors">Recover Password?</Link>
                </div>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-4 flex items-center text-gray-400 group-focus-within/input:text-emerald-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#161B22]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-[#161B22] transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-emerald-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading || isSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-emerald-950 font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all duration-300 group"
              >
                {loading || isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <LogIn size={20} />
                    <span>Login Now</span>
                    <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6 relative">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm"
                  >
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Security Code</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-4 flex items-center text-gray-400 group-focus-within/input:text-emerald-400 transition-colors">
                    <ShieldCheck size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full bg-[#161B22]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-emerald-400 font-mono tracking-widest text-center text-tracking-[0.5em] focus:outline-none focus:border-emerald-500/50 focus:bg-[#161B22] transition-all duration-300"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading || isSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-emerald-950 font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all duration-300 group"
              >
                {loading || isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    <span>Verify Code</span>
                    <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
              
              <button
                type="button"
                onClick={() => setShowOtp(false)}
                className="w-full text-gray-400 text-sm hover:text-white transition-colors mt-4 block text-center"
              >
                Back to Login
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 uppercase tracking-[0.2em]">
              <Sparkles size={14} className="text-emerald-500" />
              <span>Librync Secured Portal</span>
            </div>
            <Link to="/login" className="block text-sm text-gray-400 hover:text-emerald-400 transition-colors">
              Looking for the Student Portal?
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
