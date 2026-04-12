import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Lock, ArrowLeft, Loader2, CheckCircle2, ShieldEllipsis, Eye, EyeOff } from 'lucide-react';
import { resetPasswordAdmin } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const resultAction = await dispatch(resetPasswordAdmin({ email, otp, newPassword }));
      if (resetPasswordAdmin.fulfilled.match(resultAction)) {
        toast.success("Password Updated Successfully");
        navigate('/login');
      } else {
        toast.error(resultAction.payload || "Verification Failed");
      }
    } catch (err) {
      toast.error("Connection lost");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D17] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[10%] left-[-5%] w-[30%] h-[30%] bg-emerald-500/5 blur-[100px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        <div className="glass-card p-8 rounded-3xl">
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 font-mono font-bold text-2xl">
              <KeyRound size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Change Password</h1>
            <p className="text-gray-400 text-sm">
              Enter the verification code sent to your email and set your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#161B22]/50 border border-white/5 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Verification Code</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-4 flex items-center text-gray-400 group-focus-within/input:text-emerald-400">
                  <ShieldEllipsis size={18} />
                </div>
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-Digit Secure Code"
                  className="w-full bg-[#161B22]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono tracking-[0.5em]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">New Password</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-4 flex items-center text-gray-400 group-focus-within/input:text-emerald-400">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-[#161B22]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-sans"
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
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-emerald-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Update Password</span>
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
