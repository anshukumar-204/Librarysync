import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Lock, Phone, MapPin, 
  ArrowRight, ArrowLeft, Loader2, AlertCircle, 
  CheckCircle2, Sparkles, GraduationCap, Search,
  ShieldCheck, KeyRound, RefreshCw, Eye, EyeOff, Camera, Hash
} from 'lucide-react';
import { registerStudent, clearError, firebaseSyncAuth, setAuthSession } from '../../store/slices/authSlice';
import authApi from '../../services/authApi';
import toast from 'react-hot-toast';
import { auth } from '../../config/firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  sendSignInLinkToEmail 
} from "firebase/auth";

export default function StudentRegisterPage() {
  const [credential, setCredential] = useState('');
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showOtpStage, setShowOtpStage] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [editableFields, setEditableFields] = useState([]);
  const [profileImageBase64, setProfileImageBase64] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [availability, setAvailability] = useState({
    mobile: { loading: false, available: true, message: '' },
    email: { loading: false, available: true, message: '' }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'phone'
  
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    fatherName: '',
    address: '',
    village: '',
    post: '',
    district: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
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
      email: firebaseUser.email || formData.email || credential || '',
      phone: firebaseUser.phoneNumber || formData.mobile || credential || '',
      firebaseUid: firebaseUser.uid,
      displayName: firebaseUser.displayName || formData.fullName || '',
      providerId: providerIds[0] || null,
      providerIds,
    };
  };

  // --- LIVE AVAILABILITY TRIGGER ---
  React.useEffect(() => {
    if (!isVerified || step !== 1) return;

    const checkValue = async (type, value) => {
      // Basic validation before API call
      if (!value || value.trim().length < 5) {
        setAvailability(prev => ({ ...prev, [type]: { loading: false, available: true, message: '' } }));
        return;
      }

      setAvailability(prev => ({ ...prev, [type]: { ...prev[type], loading: true, message: '' } }));
      try {
        const res = await authApi.checkAvailability({ type, value });
        setAvailability(prev => ({ 
          ...prev, 
          [type]: { 
            loading: false, 
            available: res.available, 
            message: res.message 
          } 
        }));
      } catch (err) {
        setAvailability(prev => ({ ...prev, [type]: { loading: false, available: true, message: '' } }));
      }
    };

    const emailTimer = setTimeout(() => checkValue('email', formData.email), 600);

    return () => {
      clearTimeout(emailTimer);
    };
  }, [formData.mobile, formData.email, isVerified, step]);

  const forceCheck = (type) => {
    const value = formData[type];
    if (!value || value.trim().length < 5) return;
    
    const runCheck = async () => {
      setAvailability(prev => ({ ...prev, [type]: { ...prev[type], loading: true, message: '' } }));
      try {
        const res = await authApi.checkAvailability({ type, value });
        setAvailability(prev => ({ 
          ...prev, 
          [type]: { loading: false, available: res.available, message: res.message } 
        }));
      } catch (err) {
        setAvailability(prev => ({ ...prev, [type]: { loading: false, available: true, message: '' } }));
      }
    };
    runCheck();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const normalizedCredential = normalizeCredential(credential);
    if (!normalizedCredential) {
      toast.error('Enter your registered mobile number or email.');
      return;
    }
    setIsVerifying(true);
    try {
      const response = await authApi.verifyRegistration(normalizedCredential);
      const payload = response?.data || response?.student || response;
      const student = payload?.student || payload;

      if (response?.success === false || !student) {
        throw new Error(response?.message || 'Student record not found in database.');
      }

      const fullName = payload?.fullName || student?.fullName || '';
      const mobile = payload?.mobile || student?.mobile || normalizedCredential;
      const email = payload?.email || student?.email || '';

      setFormData(prev => ({
        ...prev,
        fullName: fullName || '',
        mobile: mobile || '',
        email: email || '',
        fatherName: student?.fatherName || '',
        address: student?.address || '',
        village: student?.village || '',
        post: student?.post || '',
        district: student?.district || '',
        city: student?.city || '',
        state: student?.state || '',
        pincode: student?.pincode || '',
      }));
      setCredential(normalizedCredential);
      setIsVerified(true);
      // Only names in this array will be editable (and thus mandatory)
      const editable = [];
      if (!fullName || fullName === "New Student") editable.push('fullName');
      if (!email) editable.push('email');
      if (!student?.fatherName) editable.push('fatherName');
      if (!student?.address) editable.push('address');
      if (!student?.village) editable.push('village');
      if (!student?.post) editable.push('post');
      if (!student?.district) editable.push('district');
      if (!student?.city) editable.push('city');
      if (!student?.state) editable.push('state');
      if (!student?.pincode) editable.push('pincode');
      
      setEditableFields(editable);
      toast.success("Profile found. Missing fields unlocked.");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Student record not found in database.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    const newErrors = {};

    // Validate current step
    if (step === 1) {
      const requiredStep1 = [
        'fullName', 'fatherName', 'email', 'mobile', 
        'address', 'village', 'post', 'district', 'city', 'state', 'pincode'
      ];
      requiredStep1.forEach(field => {
        // Only validate if field was supposed to be editable/provided
        if (editableFields.includes(field) && !formData[field]) {
          newErrors[field] = true;
        }
      });
    } else {
      if (!formData.password) newErrors.password = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill all mandatory fields.");
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    dispatch(clearError());
    setIsSubmitting(true);
    try {
      const normalizedCredential = normalizeCredential(credential);
      // Step 2 submit triggers OTP send
      const response = await authApi.register({
        ...formData,
        profileImage: profileImageBase64, 
        credential: normalizedCredential 
      });
      if (response.pendingVerification) {
        setShowOtpStage(true);
        toast.success("Activation code sent to your email.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed to initiate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalActivation = async (e) => {
    e.preventDefault();
    setIsActivating(true);
    try {
      const response = await authApi.completeRegistration(normalizeCredential(credential), otp);
      if (response.success) {
        dispatch(setAuthSession(response));
        toast.success("Portal Account Active. Welcome!");
        navigate('/student/portal');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Activation code incorrect.");
    } finally {
      setIsActivating(false);
    }
  };

  // --- FIREBASE PHONE AUTH ---
  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) return;
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': () => {}
    });
  };

  const startPhoneAuth = async () => {
    if (!formData.mobile || formData.mobile.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number first.');
      return;
    }
    setIsSubmitting(true);
    try {
      // Reset old verifier if it exists (handles page re-use)
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = formData.mobile.startsWith('+') ? formData.mobile : `+91${formData.mobile}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setAuthMethod('phone');
      setShowOtpStage(true);
      toast.success(`SMS code sent to ${formattedPhone}. Check your messages.`);
    } catch (err) {
      console.error('Phone auth error:', err);
      if (err.code === 'auth/too-many-requests') {
        toast.error('Too many SMS attempts. Please try again after some time.');
      } else if (err.code === 'auth/invalid-phone-number') {
        toast.error('Invalid phone number format. Use +91XXXXXXXXXX.');
      } else {
        toast.error('SMS dispatch failed. Free quota (10/day) may be exhausted. Use email instead.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFirebaseOtpVerify = async (e) => {
    e.preventDefault();
    if (!confirmationResult) {
      toast.error('Session expired. Please resend the SMS code.');
      setShowOtpStage(false);
      setAuthMethod('email');
      return;
    }
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the complete 6-digit code.');
      return;
    }
    setIsActivating(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const syncPayload = await buildFirebaseSyncPayload(result.user);
      const resultAction = await dispatch(firebaseSyncAuth(syncPayload));
      if (firebaseSyncAuth.fulfilled.match(resultAction)) {
        toast.success('Phone verified! Your portal is now active. Welcome!');
        navigate('/student/portal');
      } else {
        toast.error(resultAction.payload || 'Sync failed. Contact admin.');
      }
    } catch (err) {
      if (err.code === 'auth/invalid-verification-code') {
        toast.error('OTP is incorrect. Please re-check and try again.');
      } else if (err.code === 'auth/code-expired') {
        toast.error('OTP has expired. Click "Resend" to get a new code.');
      } else {
        toast.error(err?.response?.data?.message || 'Verification failed. Please try again.');
      }
    } finally {
      setIsActivating(false);
    }
  };

  const handleActivationSubmit = (e) => {
    if (authMethod === 'phone') {
      return handleFirebaseOtpVerify(e);
    }
    return handleFinalActivation(e);
  };

  // Inquiry Stage (Screen 1)
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-[#0B0D17] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[130px] rounded-full" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md z-10">
          <div className="glass-card p-10 rounded-3xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
            
            <div className="text-center mb-10 relative">
              <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 mx-auto">
                <ShieldCheck size={42} strokeWidth={1} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Find Your Record</h1>
              <p className="text-gray-400 text-sm">Verify your student details to start registration.</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6 relative">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Mobile or Email</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-4 flex items-center text-gray-400 group-focus-within/input:text-blue-400 transition-colors">
                    <Search size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    placeholder="Email or Mobile Number..."
                    className="w-full bg-[#161B22]/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={isVerifying}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all group"
              >
                {isVerifying ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <span>Verify Profile</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center relative z-20">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Secure Verification Active</p>
              <Link to="/login" className="inline-block mt-4 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer pointer-events-auto">
                Back to Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // OTP Stage (Screen 3)
  if (showOtpStage) {
    return (
      <div className="min-h-screen bg-[#0B0D17] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[130px] rounded-full" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md z-10">
          <div className="glass-card p-10 rounded-3xl relative overflow-hidden text-center">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 mx-auto">
              <KeyRound size={42} strokeWidth={1} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Final Activation</h2>
            <p className="text-gray-400 text-sm mb-10">Enter the 6-digit activation code sent to your email.</p>

            <form onSubmit={handleActivationSubmit} className="space-y-8">
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="0 0 0 0 0 0"
                className="w-full bg-transparent border-b-2 border-white/10 text-center text-4xl font-bold tracking-[0.8em] text-white focus:outline-none focus:border-emerald-500 transition-all pb-4"
                autoFocus
                required
              />

              <div className="flex flex-col gap-4">
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isActivating}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  {isActivating ? <Loader2 className="animate-spin" size={20} /> : "Finalize Activation"}
                </motion.button>
                
                {authMethod === 'email' && (
                  <button 
                    type="button"
                    onClick={() => {
                       // Lock the form first then start phone auth
                       startPhoneAuth();
                    }} 
                    className="flex items-center justify-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors py-2 uppercase tracking-widest font-bold"
                  >
                    Didn't get email? Use Phone SMS (Firebase)
                  </button>
                )}

                <button 
                  type="button"
                  onClick={handleSubmit} 
                  className="flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-emerald-400 transition-colors py-2 uppercase tracking-widest font-bold"
                >
                  <RefreshCw size={14} />
                  Resend Code
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // Profile Form Stage (Screen 2)
  return (
    <div className="min-h-screen bg-[#0B0D17] flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl z-10">
        <div className="glass-card p-6 md:p-10 rounded-[2.5rem] relative overflow-hidden">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-3">
              <Sparkles className="text-blue-400" />
              Setup Your Account
            </h1>
            <p className="text-gray-400 text-sm">Verify and update your details before activating your portal account.</p>
          </div>

          <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === i ? 'bg-blue-500 text-white' : step > i ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-500 border border-white/5'
                }`}>
                  {step > i ? <CheckCircle2 size={16} /> : i}
                </div>
                <span className={`text-xs font-semibold uppercase tracking-widest ${step === i ? 'text-white' : 'text-gray-500'}`}>
                  {i === 1 ? 'Details' : 'Security'}
                </span>
                {i === 1 && <div className="w-8 h-px bg-white/5 mx-2" />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm"
                >
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {step === 1 ? (
                <>
                  <div className="md:col-span-2 flex flex-col items-center mb-6">
                    <div className="relative group self-center">
                      <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-gray-500 overflow-hidden transition-all group-hover:border-blue-500/50">
                        {imagePreview ? (
                          <img src={imagePreview} className="w-full h-full object-cover" alt="profile" />
                        ) : (
                          <Camera size={24} />
                        )}
                      </div>
                      <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white border-4 border-[#0B0D17] cursor-pointer hover:scale-110 transition-transform">
                        <span className="text-xl font-bold">+</span>
                        <input type="file" accept="image/*" hidden onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setImagePreview(URL.createObjectURL(file));
                            const reader = new FileReader();
                            reader.onloadend = () => setProfileImageBase64(reader.result);
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </label>
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-3">Upload Profile Image (Optional)</span>
                  </div>

                  <Input 
                    label="Full Name"
                    name="fullName"
                    value={formData.fullName} 
                    readOnly={!editableFields.includes('fullName')} 
                    onChange={handleInputChange}
                    icon={User} 
                    required={editableFields.includes('fullName')}
                    error={errors.fullName}
                    autoComplete="name"
                    className={!editableFields.includes('fullName') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                  />
                  <Input 
                    label="Mobile Number"
                    value={formData.mobile} 
                    readOnly 
                    icon={Phone} 
                    error={errors.mobile}
                    autoComplete="tel"
                    className="opacity-50 blur-[0.5px] cursor-not-allowed"
                  />
                  <Input 
                    label="Father's Name"
                    name="fatherName"
                    value={formData.fatherName} 
                    readOnly={!editableFields.includes('fatherName')} 
                    onChange={handleInputChange}
                    icon={User} 
                    required={editableFields.includes('fatherName')}
                    error={errors.fatherName}
                    className={!editableFields.includes('fatherName') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                  />
                  <Input 
                    label="Email Address"
                    name="email"
                    value={formData.email} 
                    readOnly={!editableFields.includes('email')} 
                    onChange={handleInputChange}
                    icon={Mail} 
                    required={editableFields.includes('email')}
                    status={availability.email}
                    error={errors.email}
                    autoComplete="email"
                    onCheckNow={editableFields.includes('email') ? () => forceCheck('email') : null}
                    className={availability.email.available === false ? "border-rose-500/50" : !editableFields.includes('email') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                  />
                  <div className="md:col-span-2">
                    <Input 
                      label="Full Address (House/Gali)"
                      name="address" 
                      value={formData.address} 
                      readOnly={!editableFields.includes('address')} 
                      onChange={handleInputChange}
                      icon={MapPin} 
                      required={editableFields.includes('address')}
                      error={errors.address}
                      autoComplete="street-address"
                      className={!editableFields.includes('address') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                    />
                  </div>
                  <Input 
                    label="Village/Town"
                    name="village" 
                    value={formData.village} 
                    readOnly={!editableFields.includes('village')} 
                    onChange={handleInputChange}
                    icon={MapPin} 
                    required={editableFields.includes('village')}
                    error={errors.village}
                    className={!editableFields.includes('village') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                  />
                  <Input 
                    label="Post Office"
                    name="post" 
                    value={formData.post} 
                    readOnly={!editableFields.includes('post')} 
                    onChange={handleInputChange}
                    icon={MapPin} 
                    required={editableFields.includes('post')}
                    error={errors.post}
                    className={!editableFields.includes('post') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                  />
                  <Input 
                    label="City"
                    name="city" 
                    value={formData.city} 
                    readOnly={!editableFields.includes('city')} 
                    onChange={handleInputChange}
                    icon={MapPin} 
                    required={editableFields.includes('city')}
                    error={errors.city}
                    className={!editableFields.includes('city') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                  />
                  <Input 
                    label="District"
                    name="district" 
                    value={formData.district} 
                    readOnly={!editableFields.includes('district')} 
                    onChange={handleInputChange}
                    icon={MapPin} 
                    required={editableFields.includes('district')}
                    error={errors.district}
                    className={!editableFields.includes('district') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                  />
                  <Input 
                    label="State"
                    name="state" 
                    value={formData.state} 
                    readOnly={!editableFields.includes('state')} 
                    onChange={handleInputChange}
                    icon={MapPin} 
                    required={editableFields.includes('state')}
                    error={errors.state}
                    className={!editableFields.includes('state') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                  />
                  <Input 
                    label="Pincode"
                    name="pincode" 
                    value={formData.pincode} 
                    readOnly={!editableFields.includes('pincode')} 
                    onChange={handleInputChange}
                    icon={Hash} 
                    required={editableFields.includes('pincode')}
                    error={errors.pincode}
                    autoComplete="postal-code"
                    className={!editableFields.includes('pincode') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                  />
                </>
              ) : (
                <>
                  <div className="md:col-span-2 space-y-4">
                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-blue-400/80 text-xs flex gap-3">
                      <ShieldCheck size={18} className="flex-shrink-0" />
                      <p>Details verified. Standard profile data is locked. Create a strong password (8+ chars) to activate your account.</p>
                    </div>
                    <Input label="Create Your Password" name="password" icon={Lock} placeholder="••••••••" value={formData.password} onChange={handleInputChange} type="password" required error={errors.password} autoComplete="new-password" />
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col-reverse md:flex-row gap-4 pt-6">
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all">
                  <ArrowLeft size={18} />
                  Back
                </button>
              )}
              <motion.button 
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} disabled={loading || isSubmitting}
                className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all group"
              >
                {loading || isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <span>{step === 1 ? 'Save and Continue' : 'Complete Registration'}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
              <div id="recaptcha-container"></div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function Input({ label, icon: Icon, className, type, status, required, error, onCheckNow, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-1">
        {label}
        {required && <span className="text-rose-500 text-lg leading-none">*</span>}
      </label>
      <div className="relative group/input">
        {Icon && (
          <div className={`absolute inset-y-0 left-4 flex items-center transition-colors ${error ? 'text-rose-400' : 'text-gray-400 group-focus-within/input:text-blue-400'}`}>
            <Icon size={16} />
          </div>
        )}
        <input 
          {...props}
          type={effectiveType}
          className={`w-full bg-[#161B22]/50 border ${error ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.1)]' : status?.available === false ? 'border-rose-500/50' : 'border-white/5'} rounded-xl py-3.5 ${Icon ? 'pl-11' : 'px-4'} ${isPassword ? 'pr-12' : 'pr-4'} text-white text-sm focus:outline-none ${error ? 'focus:border-rose-500' : 'focus:border-blue-500/50'} focus:bg-[#161B22] transition-all ${className}`}
        />
        
        {/* Status Badges inside input */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {status?.loading && <Loader2 size={12} className="text-blue-500 animate-spin" />}
          
          {!status?.loading && status?.available === false && <AlertCircle size={14} className="text-rose-500" />}
          
          {!status?.loading && status?.available === true && props.value && props.value.length > 5 && (
            <CheckCircle2 size={14} className="text-emerald-500" />
          )}
 
          {/* Manual Verify Action - Persistent so users can re-trigger check if needed */}
          {status && !status.loading && props.value && props.value.length > 5 && (status.onCheckNow || props.onCheckNow) && (
            <button 
              type="button"
              onClick={status.onCheckNow || onCheckNow}
              className="text-[8px] font-black uppercase tracking-tighter px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-zinc-400"
            >
              Check Now
            </button>
          )}

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-500 hover:text-blue-400 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Detailed Success Metadata below input */}
      {!isPassword && status?.available && status?.message && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 ml-1"
        >
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            {status.message}
          </p>
        </motion.div>
      )}
    </div>
  );
}
