import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Loader2, ArrowRight,
  AlertCircle, GraduationCap, Eye, EyeOff, Phone,
  Sparkles, ShieldCheck, Fingerprint
} from 'lucide-react';
import { loginAdmin, clearError, firebaseSyncAuth } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { auth } from '../../config/firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

export default function StudentLoginPage() {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'phone' | 'link'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showOtpField, setShowOtpField] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.adminAuth);

  const normalizeCredential = (value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return '';
    if (trimmed.includes('@')) return trimmed.toLowerCase();

    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      return digitsOnly.slice(2);
    }
    if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      return digitsOnly.slice(1);
    }
    return digitsOnly || trimmed;
  };

  const buildFirebaseSyncPayload = async (firebaseUser) => {
    const providerIds = (firebaseUser.providerData || [])
      .map((provider) => provider?.providerId)
      .filter(Boolean);

    return {
      idToken: await firebaseUser.getIdToken(),
      email: firebaseUser.email || credential || '',
      phone: firebaseUser.phoneNumber || credential || '',
      firebaseUid: firebaseUser.uid,
      displayName: firebaseUser.displayName || '',
      providerId: providerIds[0] || null,
      providerIds,
    };
  };

  // --- Standard Password Login ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    setIsSubmitting(true);
    try {
      const resultAction = await dispatch(loginAdmin({ credential: normalizeCredential(credential), password }));
      if (loginAdmin.fulfilled.match(resultAction)) {
        if (resultAction.payload.requiresOtp) {
          toast.error('This account requires OTP verification. Please use a supported OTP login method.');
        } else {
          toast.success('Welcome back! Portal access granted.');
          navigate('/student/portal');
        }
      } else {
        toast.error(resultAction.payload || 'Invalid login details.');
      }
    } catch {
      toast.error('Connection failure. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Firebase Phone Auth ---
  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) return;
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => { }
    });
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    const normalizedPhone = normalizeCredential(credential);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      toast.error('Valid mobile number required.');
      return;
    }
    setIsSubmitting(true);
    try {
      setupRecaptcha();
      const formattedPhone = `+91${normalizedPhone}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setCredential(normalizedPhone);
      setShowOtpField(true);
      toast.success('Security code sent to your mobile.');
    } catch (err) {
      console.error(err);
      toast.error('SMS limit exceeded or network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const syncPayload = await buildFirebaseSyncPayload(result.user);
      const resultAction = await dispatch(firebaseSyncAuth(syncPayload));
      if (firebaseSyncAuth.fulfilled.match(resultAction)) {
        toast.success('Identity verified safely.');
        navigate('/student/portal');
      } else {
        toast.error(resultAction.payload || 'Firebase synchronization failed.');
      }
    } catch {
      toast.error('Invalid code. Please check and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Firebase Magic Link ---
  const handleEmailLinkSend = async (e) => {
    e.preventDefault();
    const normalizedEmail = normalizeCredential(credential);
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      toast.error('Please enter a valid email.');
      return;
    }
    setIsSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
      const actionCodeSettings = {
        url: `${baseUrl}/login`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, normalizedEmail, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', normalizedEmail);
      setCredential(normalizedEmail);
      setLinkSent(true);
      toast.success('Magic link sent to your email.');
    } catch (err) {
      console.error(err);
      toast.error('Service unavailable. Try another method.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Google Sign-In ---
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const syncPayload = await buildFirebaseSyncPayload(result.user);
      const resultAction = await dispatch(firebaseSyncAuth(syncPayload));
      if (firebaseSyncAuth.fulfilled.match(resultAction)) {
        toast.success(`Welcome back, ${result.user.displayName}!`);
        navigate('/student/portal');
      } else {
        toast.error(resultAction.payload || 'Account not registered.');
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error('Google Sign-in failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Confirm your email to sign in:');
      }
      const verifyLink = async () => {
        setIsSubmitting(true);
        try {
          const result = await signInWithEmailLink(auth, email, window.location.href);
          const syncPayload = await buildFirebaseSyncPayload(result.user);
          const resultAction = await dispatch(firebaseSyncAuth(syncPayload));
          if (firebaseSyncAuth.fulfilled.match(resultAction)) {
            toast.success('Access Link verified!');
            window.localStorage.removeItem('emailForSignIn');
            navigate('/student/portal');
          } else {
            toast.error(resultAction.payload || 'Firebase synchronization failed.');
          }
        } catch {
          toast.error('Link expired or invalid.');
        } finally {
          setIsSubmitting(false);
        }
      };
      verifyLink();
    }
  }, [dispatch, navigate]);

  const isBusy = loading || isSubmitting;

  return (
    <div className="min-h-screen bg-[#0B0D17] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glows matching Register Page */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[130px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[130px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="glass-card p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-6 text-blue-400"
            >
              <GraduationCap size={40} strokeWidth={1.5} />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Student Portal</h1>
            <p className="text-gray-400 text-sm">Access your attendance & study records.</p>
          </div>

          {/* Login Tabs */}
          <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/5">
            {[
              { id: 'password', label: 'Password', icon: Lock },
              { id: 'phone', label: 'Phone', icon: Phone },
              { id: 'link', label: 'Magic', icon: Sparkles }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => { setLoginMethod(m.id); setShowOtpField(false); setLinkSent(false); }}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${loginMethod === m.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-white'}`}
              >
                <m.icon size={14} />
                {m.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={loginMethod + linkSent}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {linkSent ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center mb-6">
                  <Sparkles size={32} className="text-emerald-400 mx-auto mb-3" />
                  <p className="text-white font-bold mb-1">Magic Link Sent!</p>
                  <p className="text-gray-400 text-xs">Please check your inbox at <span className="text-emerald-400">{credential}</span> to sign in.</p>
                  <button onClick={() => setLinkSent(false)} className="mt-4 text-[10px] uppercase font-black text-emerald-500 tracking-widest hover:text-white transition-colors">Retry Email</button>
                </div>
              ) : (
                <form onSubmit={
                  loginMethod === 'password' ? handleSubmit :
                    loginMethod === 'phone' ? (showOtpField ? handleOtpVerify : handlePhoneSubmit) :
                      handleEmailLinkSend
                } className="space-y-6">

                  <Input
                    label={loginMethod === 'phone' ? 'Mobile Number' : 'Email Address'}
                    placeholder={loginMethod === 'phone' ? 'Enter registered mobile' : 'name@example.com'}
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    icon={loginMethod === 'phone' ? Phone : Mail}
                    required
                    autoComplete={loginMethod === 'phone' ? 'tel' : 'username'}
                  />

                  {loginMethod === 'password' && (
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      icon={Lock}
                      required
                      showPasswordToggle
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                      autoComplete="current-password"
                    />
                  )}

                  {loginMethod === 'phone' && showOtpField && (
                    <Input
                      label="Verification Code"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      icon={ShieldCheck}
                      required
                      maxLength={6}
                    />
                  )}

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isBusy}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all group"
                  >
                    {isBusy ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        <span>{
                          loginMethod === 'phone' ? (showOtpField ? 'Confirm Login' : 'Send Verification OTP') :
                            loginMethod === 'link' ? 'Email Me a Link' : 'Secure Login'
                        }</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Social Logins */}
          <div className="mt-10 pt-8 border-t border-white/5">
            <p className="text-center text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-6">Or continue with</p>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignIn}
              disabled={isBusy}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-bold py-3.5 rounded-xl transition-all shadow-xl"
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Google
            </motion.button>
          </div>

          <div id="recaptcha-container"></div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-500 hover:text-blue-400 font-bold underline-offset-4 hover:underline">Register Presence</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Input({ label, icon: Icon, type, showPasswordToggle, showPassword, onTogglePassword, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">
        {label}
      </label>
      <div className="relative group/input">
        <div className="absolute inset-y-0 left-4 flex items-center text-gray-500 group-focus-within/input:text-blue-400 transition-colors">
          <Icon size={16} />
        </div>
        <input
          {...props}
          type={type}
          className="w-full bg-[#161B22]/50 border border-white/5 rounded-xl py-3.5 pl-11 pr-12 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:bg-[#161B22] transition-all"
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-blue-400 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
