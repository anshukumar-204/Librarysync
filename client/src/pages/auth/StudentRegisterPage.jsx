import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Lock, Phone, MapPin, 
  ArrowRight, ArrowLeft, Loader2, AlertCircle, 
  CheckCircle2, Sparkles, GraduationCap, Search,
  ShieldCheck, KeyRound, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { registerStudent, clearError } from '../../store/slices/authSlice';
import authApi from '../../services/authApi';
import toast from 'react-hot-toast';

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
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.adminAuth);

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

    const mobileTimer = setTimeout(() => checkValue('mobile', formData.mobile), 600);
    const emailTimer = setTimeout(() => checkValue('email', formData.email), 600);

    return () => {
      clearTimeout(mobileTimer);
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
    setIsVerifying(true);
    try {
      const response = await authApi.verifyRegistration(credential);
      if (response.success) {
        const { fullName, mobile, email, student } = response.data;
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
        setIsVerified(true);
        // Only names in this array will be editable (and thus mandatory)
        const editable = [];
        if (!fullName || fullName === "New Student") editable.push('fullName');
        if (!email) editable.push('email');
        if (!student?.fatherName) editable.push('fatherName');
        if (!student?.address) editable.push('address');
        if (!student?.village) editable.push('village');
        if (!student?.city) editable.push('city');
        if (!student?.state) editable.push('state');
        if (!student?.pincode) editable.push('pincode');
        
        setEditableFields(editable);
        toast.success("Profile found. Missing fields unlocked.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Student record not found in database.");
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
    if (step === 1) {
      setStep(2);
      return;
    }

    dispatch(clearError());
    try {
      // Step 2 submit triggers OTP send
      const response = await authApi.register({
        ...formData,
        profileImage: profileImageBase64, // Include the base64 image
        credential: credential // Use original identifier
      });
      if (response.pendingVerification) {
        setShowOtpStage(true);
        toast.success("Activation code sent to your email.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed to initiate.");
    }
  };

  const handleFinalActivation = async (e) => {
    e.preventDefault();
    setIsActivating(true);
    try {
      const response = await authApi.completeRegistration(credential, otp);
      if (response.success) {
        toast.success("Portal Account Active. Welcome!");
        // We manually update state or just navigate to login
        // Re-using login logic for seamless entry
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        navigate('/student/portal');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Activation code incorrect.");
    } finally {
      setIsActivating(false);
    }
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

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Secure Verification Active</p>
              <Link to="/login" className="inline-block mt-4 text-sm text-gray-400 hover:text-white transition-colors">Back to Login</Link>
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

            <form onSubmit={handleFinalActivation} className="space-y-8">
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
                  disabled={isActivating}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  {isActivating ? <Loader2 className="animate-spin" size={20} /> : "Finalize Activation"}
                </motion.button>
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
                    label={`Full Name ${editableFields.includes('fullName') ? '*' : ''}`}
                    name="fullName"
                    value={formData.fullName} 
                    readOnly={!editableFields.includes('fullName')} 
                    onChange={handleInputChange}
                    icon={User} 
                    required={editableFields.includes('fullName')}
                    className={!editableFields.includes('fullName') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                  />
                  <Input 
                    value={formData.mobile} 
                    readOnly 
                    icon={Phone} 
                    status={availability.mobile}
                    onCheckNow={() => forceCheck('mobile')}
                    className={availability.mobile.available === false ? "border-rose-500/50" : "opacity-50 blur-[0.5px] cursor-not-allowed"} 
                  />
                  <Input 
                    label={`Father's Name ${editableFields.includes('fatherName') ? '*' : ''}`}
                    name="fatherName"
                    value={formData.fatherName} 
                    readOnly={!editableFields.includes('fatherName')} 
                    onChange={handleInputChange}
                    icon={User} 
                    required={editableFields.includes('fatherName')}
                    className={!editableFields.includes('fatherName') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                  />
                  <Input 
                    label={`Email Address ${editableFields.includes('email') ? '*' : ''}`}
                    name="email"
                    value={formData.email} 
                    readOnly={!editableFields.includes('email')} 
                    onChange={handleInputChange}
                    icon={Mail} 
                    required={editableFields.includes('email')}
                    status={availability.email}
                    onCheckNow={() => forceCheck('email')}
                    className={availability.email.available === false ? "border-rose-500/50" : !editableFields.includes('email') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                  />
                  <div className="md:col-span-2">
                    <Input 
                      label={`Full Address ${editableFields.includes('address') ? '*' : ''}`}
                      name="address" 
                      value={formData.address} 
                      readOnly={!editableFields.includes('address')} 
                      onChange={handleInputChange}
                      icon={MapPin} 
                      required={editableFields.includes('address')}
                      className={!editableFields.includes('address') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                    />
                  </div>
                  <Input 
                    label={`Village/Town ${editableFields.includes('village') ? '*' : ''}`}
                    name="village" 
                    value={formData.village} 
                    readOnly={!editableFields.includes('village')} 
                    onChange={handleInputChange}
                    icon={MapPin} 
                    required={editableFields.includes('village')}
                    className={!editableFields.includes('village') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                  />
                  <Input 
                    label={`City/District ${editableFields.includes('city') ? '*' : ''}`}
                    name="city" 
                    value={formData.city} 
                    readOnly={!editableFields.includes('city')} 
                    onChange={handleInputChange}
                    icon={MapPin} 
                    required={editableFields.includes('city')}
                    className={!editableFields.includes('city') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                  />
                </>
              ) : (
                <>
                  <div className="md:col-span-2 space-y-4">
                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-blue-400/80 text-xs flex gap-3">
                      <ShieldCheck size={18} className="flex-shrink-0" />
                      <p>Details verified. Standard profile data is locked. Create a strong password (8+ chars) to activate your account.</p>
                    </div>
                    <Input label="Create Your Password" name="password" icon={Lock} placeholder="••••••••" value={formData.password} onChange={handleInputChange} type="password" required />
                  </div>
                   <Input 
                    label={`State ${editableFields.includes('state') ? '*' : ''}`}
                    name="state" 
                    value={formData.state} 
                    readOnly={!editableFields.includes('state')} 
                    onChange={handleInputChange}
                    icon={MapPin} 
                    required={editableFields.includes('state')}
                    className={!editableFields.includes('state') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                  />
                  <Input 
                    label={`Pincode ${editableFields.includes('pincode') ? '*' : ''}`}
                    name="pincode" 
                    value={formData.pincode} 
                    readOnly={!editableFields.includes('pincode')} 
                    onChange={handleInputChange}
                    icon={MapPin} 
                    required={editableFields.includes('pincode')}
                    className={!editableFields.includes('pincode') ? "opacity-50 blur-[0.5px] cursor-not-allowed" : "border-blue-500/30"} 
                  />
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
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} disabled={loading}
                className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all group"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <span>{step === 1 ? 'Save and Continue' : 'Complete Registration'}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function Input({ label, icon: Icon, className, type, status, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">{label}</label>
      <div className="relative group/input">
        {Icon && (
          <div className="absolute inset-y-0 left-4 flex items-center text-gray-400 group-focus-within/input:text-blue-400 transition-colors">
            <Icon size={16} />
          </div>
        )}
        <input 
          {...props}
          type={effectiveType}
          className={`w-full bg-[#161B22]/50 border ${status?.available === false ? 'border-rose-500/50' : 'border-white/5'} rounded-xl py-3.5 ${Icon ? 'pl-11' : 'px-4'} ${isPassword ? 'pr-12' : 'pr-4'} text-white text-sm focus:outline-none focus:border-blue-500/50 focus:bg-[#161B22] transition-all ${className}`}
        />
        
        {/* Status Badges inside input */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {status?.loading && <Loader2 size={12} className="text-blue-500 animate-spin" />}
          
          {!status?.loading && status?.available === false && <AlertCircle size={14} className="text-rose-500" />}
          
          {!status?.loading && status?.available === true && props.value && props.value.length > 5 && (
            <CheckCircle2 size={14} className="text-emerald-500" />
          )}

          {/* Manual Verify Action - Persistent so users can re-trigger check if needed */}
          {status && !status.loading && props.value && props.value.length > 5 && (
            <button 
              type="button"
              onClick={status.onCheckNow || props.onCheckNow}
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
