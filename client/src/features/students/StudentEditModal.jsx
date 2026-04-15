import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Settings, ShieldCheck,
  Loader2, Camera, Check, ChevronRight, AlertCircle,
  GraduationCap, Mail, MapPin, Home, CreditCard, Lock, Key, Smartphone
} from "lucide-react";
import { registerStudent, modifyStudent, closeEditModal, overridePassword } from './studentSlice';
import StudentProfileView from './StudentProfileView';
import StudentFeeSection from './StudentFeeSection';
import ActiveSessions from '../../components/ActiveSessions';
import { uploadImageToCloudinary } from '../../services/cloudinary';
import { checkAvailability } from '../../services/studentApi';
import toast from "react-hot-toast";

export default function StudentEditModal() {
  const dispatch = useDispatch();
  const { isEditModalOpen, editingStudent, editModalMode, loading } = useSelector(state => state.students);

  const [activeSection, setActiveSection] = useState("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [availability, setAvailability] = useState({
    mobile: { loading: false, available: true, message: '' },
    email: { loading: false, available: true, message: '' }
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    fatherName: "",
    profileImage: "",
    address: "",
    village: "",
    post: "",
    district: "",
    city: "",
    state: "",
    pincode: "",
    status: "Active",
    bio: "",
    monthlyFee: "500.0",
    joinDate: new Date().toISOString().split('T')[0]
  });
  
  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: "",
    isRevealed: false
  });

  useEffect(() => {
    if (isEditModalOpen) {
      if (editingStudent) {
        setFormData({
          fullName: editingStudent.fullName || editingStudent.name || "",
          email: editingStudent.email || editingStudent.user?.email || "",
          mobile: editingStudent.mobile || editingStudent.user?.mobile || "",
          fatherName: editingStudent.fatherName || "",
          profileImage: editingStudent.profileImage || "",
          address: editingStudent.address || "",
          village: editingStudent.village || "",
          post: editingStudent.post || "",
          district: editingStudent.district || "",
          city: editingStudent.city || "",
          state: editingStudent.state || "",
          pincode: editingStudent.pincode || "",
          status: editingStudent.status || editingStudent.user?.status || "Active",
          bio: editingStudent.bio || "",
          monthlyFee: editingStudent.monthlyFee?.toString() || "500.0",
          joinDate: editingStudent.joinDate ? editingStudent.joinDate.split('T')[0] : new Date().toISOString().split('T')[0]
        });
      } else {
        setFormData({
          fullName: "", email: "", mobile: "", fatherName: "", profileImage: "",
          address: "", village: "", post: "", district: "", city: "", state: "", pincode: "",
          status: "Active", bio: "", monthlyFee: "500.0", joinDate: new Date().toISOString().split('T')[0]
        });
      }
      setErrors({});
      setImageFile(null);
      setActiveSection("personal");
      setAvailability({
        mobile: { loading: false, available: true, message: '' },
        email: { loading: false, available: true, message: '' }
      });
    }
  }, [editingStudent, isEditModalOpen]);

  // --- LIVE AVAILABILITY TRIGGER ---
  useEffect(() => {
    if (!isEditModalOpen || editModalMode === 'view') return;

    const checkValue = async (type, value) => {
      if (!value || value.trim().length < 5) {
        setAvailability(prev => ({ ...prev, [type]: { loading: false, available: true, message: '' } }));
        return;
      }

      setAvailability(prev => ({ ...prev, [type]: { ...prev[type], loading: true, message: '' } }));
      try {
        const res = await checkAvailability({
          type,
          value,
          excludeId: editingStudent?.id
        });
        setAvailability(prev => ({
          ...prev,
          [type]: { loading: false, available: res.available, message: res.message }
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
  }, [formData.mobile, formData.email, isEditModalOpen, editModalMode, editingStudent?.id]);

  const forceCheck = (type) => {
    const value = formData[type];

    const runCheck = async () => {
      if (!value || value.trim().length < 5) return;
      setAvailability(prev => ({ ...prev, [type]: { ...prev[type], loading: true, message: '' } }));
      try {
        const res = await checkAvailability({ type, value, excludeId: editingStudent?.id });
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    let newErrors = {};
    if (!formData.mobile.trim()) newErrors.mobile = "Primary contact node required";
    // Email is now optional for admin student management

    // Block if live availability check failed
    if (!availability.mobile.available) newErrors.mobile = availability.mobile.message;
    if (!availability.email.available) newErrors.email = availability.email.message;

    setErrors(newErrors);
    if (newErrors.mobile || newErrors.email) setActiveSection("personal");

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      let imageUrl = formData.profileImage;
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadImageToCloudinary(imageFile);
        setUploading(false);
      }

      const payload = { ...formData, profileImage: imageUrl };

      if (editingStudent) {
        await dispatch(modifyStudent({ id: editingStudent.id, studentData: payload })).unwrap();
        toast.success("Student Registry Updated");
      } else {
        await dispatch(registerStudent(payload)).unwrap();
        toast.success("Student Onboarded Successfully");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Operation Failed";
      const detail = err.response?.data?.error ? ` (${err.response.data.error})` : "";
      toast.error(errorMsg + detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualReset = async () => {
    if (!resetPasswordData.newPassword || resetPasswordData.newPassword.length < 6) {
      toast.error("Security protocol requires at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(overridePassword({ 
        id: editingStudent.id, 
        newPassword: resetPasswordData.newPassword 
      })).unwrap();
      
      toast.success("Security coordinates updated. Student has been force-logged out.");
      setResetPasswordData({ newPassword: "", isRevealed: false });
    } catch (err) {
      toast.error(err || "Manual reset failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateCipher = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetPasswordData({ newPassword: pass, isRevealed: true });
  };

  const sections = [
    { id: "personal", label: "Identity", icon: User, hasError: !!errors.fullName || !!errors.fatherName || !!errors.mobile },
    { id: "residence", label: "Residence", icon: Home, hasError: !!errors.village || !!errors.post || !!errors.district || !!errors.address },
    { id: "academic", label: "Administrative", icon: ShieldCheck, hasError: false },
    ...(editingStudent ? [
      { id: "financials", label: "Fees & Ledger", icon: CreditCard, hasError: false },
      { id: "security", label: "Security Node", icon: Lock, hasError: false }
    ] : []),
  ];

  if (!isEditModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex justify-center items-center p-4 bg-black/80 backdrop-blur-xl font-sans text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#09090b] border border-white/5 w-full max-w-4xl h-[640px] rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.5)] flex overflow-hidden"
      >
        {/* SIDEBAR */}
        <div className="w-16 sm:w-60 bg-zinc-900/30 border-r border-white/[0.03] p-4 sm:p-6 flex flex-col justify-between shrink-0">
          <div className="space-y-10">
            <div className="px-2 hidden sm:block pt-2 text-left">
              <h2 className="text-xl font-black tracking-tighter italic text-white uppercase leading-none text-blue-500">LIBRYNC</h2>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1.5 opacity-80">Advanced Registry</p>
            </div>

            <nav className="space-y-3">
              {editModalMode === 'view' ? (
                <button className="w-full relative flex items-center justify-center sm:justify-start gap-4 p-4 sm:px-5 sm:py-3.5 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-wider bg-blue-600 text-white shadow-lg shadow-blue-500/10">
                  <User size={16} />
                  <span className="hidden sm:block">Full Profile</span>
                </button>
              ) : (
                sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full relative flex items-center justify-center sm:justify-start gap-4 p-4 sm:px-5 sm:py-3.5 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-wider ${activeSection === s.id
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/10'
                      : 'text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300'
                      }`}
                  >
                    <s.icon size={16} />
                    <span className="hidden sm:block">{s.label}</span>
                    {s.hasError && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#09090b]" />
                    )}
                  </button>
                ))
              )}
            </nav>
          </div>

          <div className="p-2 sm:p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 mb-2">
            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ease-out ${(loading || isSubmitting) ? 'bg-blue-500 animate-pulse' : Object.keys(errors).length > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: editModalMode === 'view' ? '100%' : (activeSection === 'personal' ? '33%' : activeSection === 'residence' ? '66%' : '100%') }}
              />
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col bg-[#0c0c0e]">
          <div className="px-8 py-6 border-b border-white/[0.03] flex justify-between items-center bg-zinc-900/40 backdrop-blur-md shrink-0">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">{activeSection} Control</span>
            <button
              onClick={() => dispatch(closeEditModal())}
              className="w-10 h-10 flex items-center justify-center bg-white/[0.03] hover:bg-rose-500/10 hover:text-rose-500 rounded-xl transition-all text-zinc-500"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-10 py-10 custom-scrollbar focus:outline-none">
            <AnimatePresence mode="wait">
              {editModalMode === 'view' ? (
                <motion.div key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-[32px] bg-zinc-900 border border-white/5 overflow-hidden shadow-2xl">
                      {editingStudent?.profileImage ? (
                        <img src={editingStudent.profileImage} className="w-full h-full object-cover" alt="profile" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-black text-blue-500 bg-gradient-to-br from-blue-500/10 to-indigo-500/5">
                          {(editingStudent?.fullName || editingStudent?.name)?.[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight leading-none">{editingStudent?.fullName || editingStudent?.name}</h3>
                      <p className="text-zinc-500 text-[10px] mt-2 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        Authenticated Registry
                      </p>
                    </div>
                  </div>
                  <StudentProfileView student={editingStudent} />
                </motion.div>
              ) : (
                <>
                  {activeSection === "personal" && (
                    <motion.div key="p" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 text-left">
                      <div className="flex flex-col sm:flex-row items-center gap-8">
                        <div className="relative group shrink-0">
                          <div className="w-28 h-28 rounded-[36px] bg-zinc-900 border border-dashed border-white/10 flex items-center justify-center text-zinc-700 group-hover:border-emerald-500/50 transition-all cursor-pointer overflow-hidden shadow-inner">
                            {uploading ? <Loader2 className="animate-spin text-emerald-500" /> :
                              formData.profileImage ? <img src={formData.profileImage} className="w-full h-full object-cover" alt="preview" /> :
                                <Camera size={28} />}
                          </div>
                          <label className="absolute -bottom-1 -right-1 w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white border-4 border-[#0c0c0e] cursor-pointer hover:scale-110 transition-transform shadow-lg">
                            <span className="text-xl font-bold">+</span>
                            <input type="file" accept="image/*" hidden onChange={(e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              setImageFile(file);
                              setFormData((prev) => ({ ...prev, profileImage: URL.createObjectURL(file) }));
                            }} />
                          </label>
                        </div>
                        <div className="flex-1 w-full">
                          <h3 className="text-lg font-black text-white tracking-tight leading-none">Institutional Identity</h3>
                          <p className="text-zinc-500 text-[11px] mt-2 italic font-medium leading-relaxed">System requires a high-resolution identification photo for the smart-card and library portal.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="col-span-2">
                          <Field label="Identification Full Name" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Alex Thompson" error={errors.fullName} isLarge />
                        </div>
                        <div className="col-span-2">
                          <Field label="Guardian Name / Relationship" name="fatherName" value={formData.fatherName} onChange={handleChange} placeholder="David Smith" error={errors.fatherName} isLarge />
                        </div>
                        <div className="col-span-2">
                          <Field
                            label="Primary Contact Number *"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                            placeholder="+1 (555) 000-0000"
                            error={errors.mobile || (availability.mobile.available === false ? availability.mobile.message : '')}
                            isLarge
                            status={availability.mobile}
                            onCheckNow={() => forceCheck('mobile')}
                          />
                        </div>
                        <div className="col-span-2">
                          <Field
                            label="Official Email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="alex@institute.edu"
                            error={errors.email || (availability.email.available === false ? availability.email.message : '')}
                            isLarge
                            status={availability.email}
                            onCheckNow={() => forceCheck('email')}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeSection === "residence" && (
                    <motion.div key="r" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin size={18} className="text-emerald-500" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Geographic Location</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="col-span-2">
                          <Field label="Village/Locality" name="village" value={formData.village} onChange={handleChange} placeholder="North Block / Village Name" error={errors.village} isLarge />
                        </div>
                        <div className="col-span-2">
                          <Field label="Post Office" name="post" value={formData.post} onChange={handleChange} placeholder="Main P.O." error={errors.post} isLarge />
                        </div>
                        <div className="col-span-2">
                          <Field label="District Registry" name="district" value={formData.district} onChange={handleChange} placeholder="New York District" error={errors.district} isLarge />
                        </div>
                        <div className="col-span-2">
                          <Field label="City Node" name="city" value={formData.city} onChange={handleChange} placeholder="Metropolis City" isLarge />
                        </div>
                        <div className="col-span-2">
                          <Field label="State / Province" name="state" value={formData.state} onChange={handleChange} placeholder="California" isLarge />
                        </div>
                        <div className="col-span-2">
                          <Field label="Postal Index Code" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="10001" isLarge />
                        </div>
                        <div className="col-span-2">
                          <Field label="Full Physical Address" name="address" value={formData.address} onChange={handleChange} placeholder="Floor, Street, Landmark..." isTextArea error={errors.address} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeSection === "academic" && (
                    <motion.div key="a" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 text-left">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2 col-span-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest block">Operational Status</label>
                          <div className="relative">
                            <select
                              name="status"
                              value={formData.status}
                              onChange={handleChange}
                              className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none appearance-none transition-all focus:border-emerald-500/30"
                            >
                              <option value="Active">Active Subscription</option>
                              <option value="Inactive">Registry Hold</option>
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-zinc-600 pointer-events-none" size={16} />
                          </div>
                        </div>
                        <div className="space-y-2 col-span-2 sm:col-span-1">
                          <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest block">Monthly Subscription Fee (₹)</label>
                          <div className="relative">
                            <input
                              type="number"
                              name="monthlyFee"
                              value={formData.monthlyFee}
                              onChange={handleChange}
                              placeholder="500.0"
                              className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-emerald-500/30 transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none text-xs font-bold">INR</div>
                          </div>
                        </div>
                        <div className="space-y-2 col-span-2 sm:col-span-1">
                          <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest block">Official Joining Date</label>
                          <div className="relative">
                            <input
                              type="date"
                              name="joinDate"
                              value={formData.joinDate}
                              onChange={handleChange}
                              className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-emerald-500/30 transition-all cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <Field label="Internal Administrative Notes" name="bio" value={formData.bio} onChange={handleChange} placeholder="Scholarships, behavioral records, etc..." isTextArea />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeSection === "financials" && (
                    <motion.div key="f" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                      <StudentFeeSection studentId={editingStudent?.id} />
                    </motion.div>
                  )}

                  {activeSection === "security" && (
                    <motion.div key="s" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-10 text-left">
                      <div className="flex items-center gap-4 p-6 bg-rose-500/5 border border-rose-500/10 rounded-3xl">
                        <AlertCircle className="text-rose-500 shrink-0" size={24} />
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-widest">Master Security Override</h3>
                          <p className="text-[10px] text-rose-500/70 font-bold uppercase tracking-widest mt-1">This action resets the student's password and terminates all active sessions across all devices.</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Smartphone size={20} />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Live Session History</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Active nodes for this identity</p>
                          </div>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                           <ActiveSessions studentId={editingStudent?.id} isAdmin={true} />
                        </div>
                      </div>

                      <div className="h-px bg-white/5 my-4" />

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest">New Institutional Password</label>
                          <div className="relative group">
                            <Key className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 group-focus-within:scale-110 transition-transform" />
                            <input 
                              type={resetPasswordData.isRevealed ? "text" : "password"}
                              value={resetPasswordData.newPassword}
                              onChange={(e) => setResetPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                              placeholder="Min 6 characters (e.g. mobile#)"
                              className="w-full bg-zinc-900 border border-white/10 rounded-[28px] py-5 pl-16 pr-8 text-xl font-black text-white focus:outline-none focus:border-emerald-500/50 transition-all outline-none"
                            />
                            <button 
                              onClick={() => setResetPasswordData(prev => ({ ...prev, isRevealed: !prev.isRevealed }))}
                              className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-tighter"
                            >
                              {resetPasswordData.isRevealed ? "Hide" : "Show"}
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <button 
                            onClick={generateCipher}
                            className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-2xl text-[10px] font-black text-zinc-400 hover:text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <Loader2 size={12} className={uploading ? "animate-spin" : ""} />
                            Generate Secure Cipher
                          </button>
                        </div>

                        <div className="pt-4">
                          <button 
                            onClick={handleManualReset}
                            disabled={isSubmitting || !resetPasswordData.newPassword}
                            className="w-full py-5 bg-rose-600 hover:bg-rose-500 text-white font-black text-sm uppercase tracking-[0.3em] rounded-[28px] shadow-2xl shadow-rose-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                          >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <ShieldCheck size={18} />}
                            Force Reset & Logout All Devices
                          </button>
                          <p className="text-[9px] text-zinc-600 text-center mt-6 font-bold uppercase tracking-widest leading-loose">
                            Warning: Resetting the password will immediately invalidate all existing login sessions for this student.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
          </div>

          {/* FOOTER */}
          <div className="px-10 py-6 border-t border-white/[0.03] bg-zinc-900/20 shrink-0 flex justify-between items-center">
            {editModalMode === 'edit' ? (
              <>
                <button
                  type="button"
                  onClick={() => { if (activeSection === 'residence') setActiveSection('personal'); if (activeSection === 'academic') setActiveSection('residence'); }}
                  className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${activeSection === 'personal' ? 'opacity-0 pointer-events-none' : 'text-zinc-500 hover:text-white'}`}
                >
                  Back
                </button>
                <button
                  onClick={activeSection === 'personal' ? () => setActiveSection('residence') : activeSection === 'residence' ? () => setActiveSection('academic') : activeSection === 'academic' ? handleSubmit : () => { }}
                  disabled={isSubmitting || uploading}
                  className={`flex items-center gap-3 px-10 py-5 bg-emerald-600 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 ${activeSection === 'financials' ? 'hidden' : ''}`}
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : activeSection === 'academic' ? <Check size={16} strokeWidth={3} /> : <ChevronRight size={16} strokeWidth={3} />}
                  <span>{activeSection === 'academic' ? (editingStudent ? 'Synchronize Record' : 'Finalize Registry') : 'Continue Registry'}</span>
                </button>
              </>
            ) : (
              <div className="w-full flex justify-end">
                <button onClick={() => dispatch(closeEditModal())} className="px-12 py-5 bg-white/[0.03] hover:bg-white/[0.08] text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest transition-all border border-white/5 shadow-xl">Dismiss</button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Internal Styled Sub-components
const Field = ({ label, error, isTextArea, isLarge, status, onCheckNow, ...props }) => (
  <div className="space-y-2 text-left">
    <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest block">
      {label}
    </label>
    <div className="relative">
      {isTextArea ? (
        <textarea
          {...props}
          className={`w-full bg-zinc-900 border ${error ? 'border-rose-500' : 'border-white/5 focus:border-emerald-500/30'} rounded-[32px] p-4 text-sm h-32 text-white outline-none resize-none transition-all placeholder:text-zinc-800 shadow-inner`}
        />
      ) : (
        <input
          {...props}
          className={`w-full bg-zinc-900 border ${error ? 'border-rose-500' : 'border-white/5 focus:border-emerald-500/30'} ${isLarge ? 'p-4 text-base tracking-tight' : 'p-4.5 text-sm'} rounded-2xl font-bold text-white outline-none transition-all placeholder:text-zinc-800 shadow-inner`}
        />
      )}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {status?.loading && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Loader2 size={12} className="text-blue-500 animate-spin" />
            <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">Verifying</span>
          </div>
        )}

        {!status?.loading && status?.available === false && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg">
            <AlertCircle size={12} className="text-rose-500" />
            <span className="text-[8px] font-black text-rose-400 uppercase tracking-tighter">Failed</span>
          </div>
        )}

        {!status?.loading && status?.available === true && props.value && props.value.length > 5 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg animate-in zoom-in-50 duration-300">
            <Check size={12} className="text-emerald-500" strokeWidth={3} />
            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter">Verified</span>
          </div>
        )}

        {/* Manual Verify Action - Persistent so users can re-check if needed */}
        {status && !status.loading && props.value && props.value.length > 5 && (
          <button
            type="button"
            onClick={onCheckNow}
            className="text-[8px] font-black uppercase tracking-tighter px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-zinc-400"
          >
            Check Now
          </button>
        )}

        {error && !props.status && <AlertCircle className="text-rose-500" size={16} />}
      </div>
    </div>
    {error && <p className="text-[9px] text-rose-500 font-bold ml-1 uppercase">{error}</p>}
    {!error && status?.available && status?.message && (
      <div className="mt-2 ml-1 flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        <p className="text-[10px] text-emerald-400 font-bold tracking-wide">
          {status.message}
        </p>
      </div>
    )}
  </div>
);
