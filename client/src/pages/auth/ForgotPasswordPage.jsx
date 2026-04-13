import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, ArrowLeft, Loader2, Send, ShieldAlert, 
  CheckCircle2, AlertCircle, Search, RefreshCw 
} from 'lucide-react';
import { forgotPasswordAdmin } from '../../store/slices/authSlice';
import authApi from '../../services/authApi';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState({ loading: false, exists: null, message: '' });
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- LIVE ACCOUNT CHECK ---
  useEffect(() => {
    if (!email || email.trim().length < 5) {
      setStatus({ loading: false, exists: null, message: '' });
      setError(false);
      return;
    }

    const timer = setTimeout(async () => {
      await performCheck();
    }, 800);

    return () => clearTimeout(timer);
  }, [email]);

  const performCheck = async () => {
    if (!email || email.trim().length < 5) return;
    
    setStatus(prev => ({ ...prev, loading: true, message: '' }));
    try {
      const res = await authApi.checkAccountExistence(email);
      setStatus({ 
        loading: false, 
        exists: res.exists, 
        message: res.message 
      });
      setError(!res.exists);
    } catch (err) {
      setStatus({ loading: false, exists: null, message: '' });
      setError(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (status.exists === false) {
      toast.error("Please enter a registered email address.");
      setError(true);
      return;
    }

    if (status.exists === null) {
      await performCheck();
      return;
    }

    setIsSubmitting(true);
    try {
      const resultAction = await dispatch(forgotPasswordAdmin(email));
      if (forgotPasswordAdmin.fulfilled.match(resultAction)) {
        toast.success("Security code sent. Please check your inbox.");
        navigate('/reset-password', { state: { email } });
      } else {
        toast.error(resultAction.payload || "Request failed. Account might not exist.");
      }
    } catch (err) {
      toast.error("Network communication error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D17] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[130px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[130px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="glass-card p-10 rounded-[2.5rem] relative overflow-hidden border border-white/5 active-glow transition-all">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-all mb-10 group relative z-20 cursor-pointer pointer-events-auto"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>

          <div className="mb-10 text-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 mx-auto shadow-2xl shadow-blue-500/10">
              {status.exists === false ? (
                <ShieldAlert size={38} className="text-rose-400" />
              ) : (
                <ShieldAlert size={38} />
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Security Protocol</h1>
            <p className="text-gray-400 text-sm leading-relaxed px-4">
              Enter email to verify account and retrieve a secure access cipher.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Input 
              label="Registered Email"
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@institute.hub"
              icon={Mail}
              required={true}
              error={error}
              status={status}
              onCheckNow={performCheck}
            />

            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting || (status.exists === false)}
              className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${
                status.exists === false 
                  ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5' 
                  : 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Send size={18} />
                  <span>Send Reset Code</span>
                </>
              )}
            </motion.button>

            {status.exists === false && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3 text-rose-400 text-[10px] font-bold uppercase tracking-widest"
              >
                <AlertCircle size={14} />
                <span>Account node not found in registry</span>
              </motion.div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function Input({ label, icon: Icon, value, onChange, placeholder, type, required, error, status, onCheckNow }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] pl-1 flex items-center gap-1">
        {label}
        {required && <span className="text-rose-500 text-lg leading-none">*</span>}
      </label>
      <div className="relative group/input">
        <div className={`absolute inset-y-0 left-4 flex items-center transition-colors ${error ? 'text-rose-400' : 'text-gray-400 group-focus-within/input:text-blue-400'}`}>
          <Icon size={18} />
        </div>
        <input 
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-[#161B22]/50 border ${
            error 
              ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]' 
              : status?.exists === true 
                ? 'border-emerald-500/50' 
                : 'border-white/5'
          } rounded-2xl py-4 pl-12 pr-12 text-white text-sm focus:outline-none transition-all duration-300`}
        />
        
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {status?.loading && <Loader2 size={16} className="text-blue-500 animate-spin" />}
          
          {!status?.loading && status?.exists === false && <AlertCircle size={18} className="text-rose-500" />}
          
          {!status?.loading && status?.exists === true && (
            <CheckCircle2 size={18} className="text-emerald-500" />
          )}

          {value && value.length > 5 && !status?.loading && status?.exists === null && (
            <button 
              type="button"
              onClick={onCheckNow}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-all"
              title="Verify Account"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {status?.exists === true && status?.message && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mt-2"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mt-0.5 flex-shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Account Verified</p>
                <p className="text-[11px] text-white font-medium leading-relaxed">
                  {status.message}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
