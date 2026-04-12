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
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  GraduationCap,
  Trophy,
  Target,
  PenLine,
  TrendingUp,
  Award,
  Settings,
  LayoutGrid,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  CheckSquare,
  PlusCircle,
  Timer,
  Activity,
  RefreshCcw,
  Zap,
  AlertCircle,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Shield,
  Power,
  IndianRupee,
  CreditCard
} from 'lucide-react';
import { logoutAdmin } from '../store/slices/authSlice';
import { getFeeStatus } from '../store/slices/feeSlice';
import { Scanner } from '@yudiel/react-qr-scanner';
import {
  fetchTodayStatus,
  fetchMetrics,
  fetchHistory,
  autoMarkAttendance,
  updateDailyGoal,
  fetchLeaderboard,
  fetchStudyLogs,
  createStudyLog,
  deleteStudyLog,
  fetchTasks,
  fetchHistoryTasks,
  createTask,
  toggleTaskStatus,
  deleteTask,
  updateTask,
  fetchRoutine,
  createRoutineNode,
  deleteRoutineNode,
  syncRoutine,
  fetchSubjectAnalytics,
  updatePomodoro,
  tickPomodoro,
  savePomodoroSettings,
  requestProfileOtp,
  updateProfileSelf
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
import { cn } from '../utils/cn';

export default function StudentDashboard() {
  const { user } = useSelector((state) => state.adminAuth);
  const {
    todayStatus,
    metrics,
    history,
    leaderboard,
    studyLogs,
    tasks,
    historyTasks,
    pomodoro,
    weeklyRoutine,
    subjectAnalytics,
    loading,
    actionLoading
  } = useSelector((state) => state.studentDashboard);
  const { status: feeStatus } = useSelector((state) => state.fees);

  const isRestricted = user?.status?.toLowerCase() === 'inactive' || user?.status?.toLowerCase() === 'hold';
  const isInLibrary = todayStatus?.status === 'In Library';

  useEffect(() => {
    if (isRestricted) {
      setActiveModal(null);
    }
  }, [isRestricted]);

  const [activeView, setActiveView] = React.useState('hub'); // 'hub' | 'rank' | 'journal' | 'history' | 'routine' | 'profile'
  const [activeModal, setActiveModal] = React.useState(null); // 'qr' | 'goal' | 'profile_otp'
  const [chartRange, setChartRange] = React.useState('week'); // 'week' | 'month' | 'year'
  const [profileFormData, setProfileFormData] = React.useState({
    fullName: '',
    fatherName: '',
    address: '',
    village: '',
    post: '',
    district: '',
    city: '',
    state: '',
    pincode: '',
    bio: '',
    profileImage: ''
  });

  const [otpValue, setOtpValue] = React.useState('');
  const [otpRequestPending, setOtpRequestPending] = React.useState(false);
  const [isProfileSynced, setIsProfileSynced] = React.useState(false);

  // Sync Profile Form Data when metrics are loaded
  useEffect(() => {
    // If we have verified student data from the registry, prioritize it
    if (metrics?.student) {
      const s = metrics.student;
      setProfileFormData({
        fullName: s.fullName || user?.name || '',
        fatherName: s.fatherName || user?.fatherName || '',
        address: s.address || user?.address || '',
        village: s.village || user?.village || '',
        post: s.post || user?.post || '',
        district: s.district || user?.district || '',
        city: s.city || user?.city || '',
        state: s.state || user?.state || '',
        pincode: s.pincode || user?.pincode || '',
        bio: s.bio || user?.bio || '',
        profileImage: s.profileImage || user?.profileImage || '',
        email: s.email || user?.email || '',
        mobile: s.mobile || user?.mobile || ''
      });
      setIsProfileSynced(true);
    } else if (user && !isProfileSynced) {
      // Fallback to basic session info while registry is loading
      setProfileFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || ''
      }));
    }
  }, [metrics?.student, user?.name, isProfileSynced]);
  const [logFormData, setLogFormData] = React.useState({
    subject: '',
    topicsCovered: '',
    hoursSpent: '',
    productivityRating: 5
  });
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [newTaskHrs, setNewTaskHrs] = React.useState('');
  const [newTaskMin, setNewTaskMin] = React.useState('');
  const [newTaskPriority, setNewTaskPriority] = React.useState('medium');
  const [taskView, setTaskView] = React.useState('today'); // 'today' | 'archived'
  const [showPomodoroSettings, setShowPomodoroSettings] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState(null);
  const [activeTaskTimer, setActiveTaskTimer] = React.useState(null); // { id, timeLeft, isRunning }
  const [isAlarmActive, setIsAlarmActive] = React.useState(false);
  const vibrationInterval = React.useRef(null);

  const [routineDay, setRoutineDay] = React.useState(new Date().getDay());
  const [newRoutineSubject, setNewRoutineSubject] = React.useState('');
  const [newRoutineHrs, setNewRoutineHrs] = React.useState('');
  const [newRoutineMin, setNewRoutineMin] = React.useState('');
  const [selectedHistoryDate, setSelectedHistoryDate] = React.useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchTodayStatus());
    dispatch(fetchMetrics());
    dispatch(fetchHistory());
    dispatch(fetchLeaderboard());
    dispatch(fetchStudyLogs());
    dispatch(fetchTasks());
    dispatch(fetchRoutine());
    dispatch(fetchSubjectAnalytics());
    dispatch(getFeeStatus());
  }, [dispatch]);

  // Pomodoro Ticker
  useEffect(() => {
    let interval;
    if (pomodoro.isRunning && pomodoro.timeLeft > 0) {
      interval = setInterval(() => {
        dispatch(tickPomodoro());
      }, 1000);
    } else if (pomodoro.timeLeft === 0 && pomodoro.isRunning) {
      handleTimerComplete('Focus Terminal');
    }
    return () => clearInterval(interval);
  }, [pomodoro.isRunning, pomodoro.timeLeft, dispatch]);

  // Task Timer Ticker
  useEffect(() => {
    let interval;
    if (activeTaskTimer?.isRunning && activeTaskTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setActiveTaskTimer(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    } else if (activeTaskTimer?.timeLeft === 0 && activeTaskTimer.isRunning) {
      const targetTask = tasks.find(t => t.id === activeTaskTimer.id);
      handleTimerComplete(`Task: ${targetTask?.title || 'Task'}`);

      // Auto-complete the task if not already completed
      if (targetTask && !targetTask.isCompleted) {
        handleToggleTask(targetTask.id, false); // Toggle from false to true
      }

      // KILL TIMER STATE TO PREVENT LOOP
      setActiveTaskTimer(null);
    }
    return () => clearInterval(interval);
  }, [activeTaskTimer?.isRunning, activeTaskTimer?.timeLeft, activeTaskTimer?.id, tasks]);

  const handleTimerComplete = (source) => {
    if (pomodoro.isRunning) {
      handlePomodoroComplete();
    }
    triggerAlarm(source);
  };

  const triggerAlarm = (source) => {
    setIsAlarmActive(true);
    toast.error(`TERMINAL ALERT: ${source} Completed!`, { duration: 6000 });

    // Recursive vibration for persistence
    const startVibration = () => {
      if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }
    };

    startVibration();
    vibrationInterval.current = setInterval(startVibration, 2000);
  };

  const stopAlarm = () => {
    setIsAlarmActive(false);
    if (vibrationInterval.current) {
      clearInterval(vibrationInterval.current);
      vibrationInterval.current = null;
    }
    if (navigator.vibrate) {
      navigator.vibrate(0); // Stop vibration
    }
    toast.success("Schedule updated.");
  };

  const handlePomodoroComplete = () => {
    const isFocus = pomodoro.mode === 'focus';
    const nextMode = isFocus ? 'break' : 'focus';
    const nextTime = nextMode === 'focus' ? 25 * 60 : 5 * 60;

    dispatch(updatePomodoro({
      isRunning: false,
      mode: nextMode,
      timeLeft: nextTime,
      sessionsCompleted: isFocus ? pomodoro.sessionsCompleted + 1 : pomodoro.sessionsCompleted
    }));

    if (isFocus) {
      toast.success("Focus Session Synchronized! Time for a short recharge.");
      const focusedHours = (pomodoro.focusDuration / 60).toFixed(1);
      setLogFormData(prev => ({
        ...prev,
        hoursSpent: ((parseFloat(prev.hoursSpent) || 0) + parseFloat(focusedHours)).toFixed(1),
        topicsCovered: prev.topicsCovered + `\n- Focus session: ${pomodoro.focusDuration}m completed`
      }));
    } else {
      toast.success("Break Terminated. Ready for the next focus node?");
    }
  };

  const handleUpdatePomodoroSettings = (focus, breakTime) => {
    dispatch(updatePomodoro({
      focusDuration: focus,
      breakDuration: breakTime,
      timeLeft: pomodoro.mode === 'focus' ? focus * 60 : breakTime * 60,
      isRunning: false
    }));
    dispatch(savePomodoroSettings());
    setShowPomodoroSettings(false);
    toast.success("Terminal rhythms updated.");
  };

  const handleToggleTimer = () => {
    dispatch(updatePomodoro({ isRunning: !pomodoro.isRunning }));
  };

  const handleResetTimer = () => {
    const time = pomodoro.mode === 'focus' ? pomodoro.focusDuration * 60 : pomodoro.breakDuration * 60;
    dispatch(updatePomodoro({ isRunning: false, timeLeft: time }));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const estimatedMinutes = (parseInt(newTaskHrs) || 0) * 60 + (parseInt(newTaskMin) || 0);
      await dispatch(createTask({
        title: newTaskTitle,
        estimatedMinutes: estimatedMinutes || null,
        priority: newTaskPriority
      })).unwrap();
      setNewTaskTitle('');
      setNewTaskHrs('');
      setNewTaskMin('');
      dispatch(fetchSubjectAnalytics()); // Refresh analytics when task added
      toast.success("Preparation node added.");
    } catch (err) {
      toast.error("Failed to add task");
    }
  };

  const handleSyncRoutine = async () => {
    try {
      await dispatch(syncRoutine()).unwrap();
      toast.success("Study schedule updated.");
    } catch (err) {
      toast.error(typeof err === 'string' ? err : (err?.message || "Schedule sync failed"));
    }
  };

  const handleSelectHistoryDate = (date) => {
    setSelectedHistoryDate(date);
    dispatch(fetchHistoryTasks(date));
  };

  const handleAddScheduleItem = async (e) => {
    e.preventDefault();
    if (!newRoutineSubject.trim()) return;

    try {
      await dispatch(createRoutineNode({
        subject: newRoutineSubject,
        dayOfWeek: routineDay,
        estimatedMinutes: (parseInt(newRoutineHrs) * 60) + parseInt(newRoutineMin)
      })).unwrap();
      setNewRoutineSubject('');
      toast.success("Schedule updated.");
    } catch (err) {
      toast.error(typeof err === 'string' ? err : (err?.message || "Failed to update schedule"));
    }
  };

  const handleRemoveScheduleItem = async (id) => {
    try {
      await dispatch(deleteRoutineNode(id)).unwrap();
      toast.success("Schedule entry removed.");
    } catch (err) {
      toast.error("Removal failure");
    }
  };

  const handleToggleTaskView = (view) => {
    setTaskView(view);
    if (view === 'archived') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      dispatch(fetchTasks(yesterday.toISOString().split('T')[0]));
    } else {
      dispatch(fetchTasks());
    }
  };

  const handleToggleTask = async (id, isCompleted) => {
    try {
      await dispatch(toggleTaskStatus({ id, isCompleted: !isCompleted })).unwrap();
    } catch (err) {
      toast.error("Status sync failed");
    }
  };
  const handleDeleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      if (activeTaskTimer) {
        handleTimerComplete('Study Session');
        setActiveTaskTimer(null);
      }
      await dispatch(deleteTask(id)).unwrap();
      toast.success("Task removed.");
    } catch (err) {
      toast.error("Removal failed");
    }
  };

  const handleEditTask = (task) => {
    const hrs = Math.floor((task.estimatedMinutes || 0) / 60);
    const mins = (task.estimatedMinutes || 0) % 60;
    setEditingTask({ ...task, editHrs: hrs, editMin: mins });
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask.title.trim()) return;
    try {
      const totalMinutes = (parseInt(editingTask.editHrs) || 0) * 60 + (parseInt(editingTask.editMin) || 0);
      await dispatch(updateTask({
        ...editingTask,
        estimatedMinutes: totalMinutes || null
      })).unwrap();
      setEditingTask(null);
      toast.success("Task updated.");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleStartTaskTimer = (task) => {
    if (activeTaskTimer?.id === task.id) {
      setActiveTaskTimer(prev => ({ ...prev, isRunning: !prev.isRunning }));
    } else {
      setActiveTaskTimer({
        id: task.id,
        timeLeft: (task.estimatedMinutes || 25) * 60,
        isRunning: true
      });
    }
  };

  // Sync logFormData hours when todayStatus changes
  useEffect(() => {
    if (todayStatus?.studyHours) {
      setLogFormData(prev => ({ ...prev, hoursSpent: todayStatus.studyHours.toFixed(1) }));
    }
  }, [todayStatus]);

  const handleUpdateGoal = async () => {
    try {
      await dispatch(updateDailyGoal(tempGoal)).unwrap();
      setActiveModal(null);
      toast.success("Goal updated.");
    } catch (err) {
      toast.error("Failed to update goal");
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRequestOtp = async () => {
    setOtpRequestPending(true);
    try {
      await dispatch(requestProfileOtp()).unwrap();
      toast.success('A verification code has been sent to your email.');
      setActiveModal('profile_otp');
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : (err?.message || 'Failed to send verification code');
      toast.error(errorMsg);
    } finally {
      setOtpRequestPending(false);
    }
  };

  const handleVerifyAndUpdate = async () => {
    if (!otpValue) return toast.error('Please enter the verification code');
    try {
      await dispatch(updateProfileSelf({ ...profileFormData, otp: otpValue })).unwrap();
      toast.success('Your profile has been updated successfully');
      setActiveModal(null);
      setOtpValue('');
      dispatch(fetchMetrics()); // Refresh data
      setIsProfileSynced(false); // Refocus sync on next metrics load
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : (err?.message || 'Failed to update profile');
      toast.error(errorMsg);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for Base64 efficiency
        return toast.error("File is too large. Please select an image under 1MB.");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileFormData(prev => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualJournalSubmit = async (e) => {
    e.preventDefault();
    if (actionLoading) return;
    try {
      await dispatch(createStudyLog(logFormData)).unwrap();
      toast.success("Study log saved.");
      setLogFormData({
        subject: '',
        topicsCovered: '',
        hoursSpent: todayStatus?.studyHours?.toFixed(1) || 0,
        productivityRating: 5
      });
      setActiveView('history');
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : (err?.message || "Failed to save log");
      toast.error(errorMsg);
    }
  };

  const handleAutoTaskLogSync = async (logData) => {
    try {
      const result = await dispatch(createStudyLog(logData)).unwrap();
      setTodayTasks(prev => prev.map(t => t.id === activeTaskTimer.id ? { ...t, isCompleted: true } : t));
      toast.success("Study log synchronized.");
      setLogFormData({ subject: '', topicsCovered: '', hoursSpent: '', productivityRating: 5 });
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : (err?.message || "Failed to save log");
      toast.error(errorMsg);
    }
  };

  const handleRemoveLog = async (id) => {
    try {
      await dispatch(deleteStudyLog(id)).unwrap();
      toast.success("Log removed.");
    } catch (err) {
      toast.error(typeof err === 'string' ? err : (err?.message || "Removal failed"));
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getElapsedTime = (checkIn) => {
    if (!checkIn) return '0M';
    const start = new Date(checkIn);
    const now = new Date();
    const diff = Math.floor((now - start) / (1000 * 60)); // in minutes
    if (diff < 60) return `${diff}M`;
    return `${Math.floor(diff / 60)}H ${diff % 60}M`;
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        await dispatch(logoutAdmin()).unwrap();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        toast.success("Security session terminated.");
      } catch (err) {
        // Fallback for network issues
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  const handleScanSuccess = async (result) => {
    if (!result || !result[0] || !result[0].rawValue) return;
    const qrValue = result[0].rawValue.trim();
    if (!qrValue) return;

    setActiveModal(null);
    try {
      await dispatch(autoMarkAttendance(qrValue)).unwrap();
      toast.success("Attendance Marked Successfully!");

      // AUTO-SYNC WORKFLOW
      await dispatch(syncRoutine()).unwrap();
      dispatch(fetchTasks());

      dispatch(fetchTodayStatus());
      dispatch(fetchMetrics());
      dispatch(fetchHistory());
    } catch (err) {
      toast.error(err || "Attendance failed");
    }
  };

  const getProcessedChartData = () => {
    if (!history) return [];

    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (chartRange === 'week' || chartRange === 'month') {
      const daysCount = chartRange === 'week' ? 7 : 30;
      const data = [];

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const record = history.find(r => r.date.split('T')[0] === dateStr);
        data.push({
          date: dateStr,
          studyHours: record ? (record.studyHours || 0) : 0
        });
      }
      return data;
    }

    if (chartRange === 'year') {
      const monthlyData = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString('default', { month: 'short' });
        monthlyData[key] = { label: key, studyHours: 0 };
      }
      history.forEach(record => {
        const d = new Date(record.date);
        const key = d.toLocaleString('default', { month: 'short' });
        if (monthlyData[key]) monthlyData[key].studyHours += (record.studyHours || 0);
      });
      return Object.values(monthlyData);
    }

    return [];
  };

  const getRangeLabel = (val) => {
    if (chartRange === 'year') return val;
    const date = new Date(val);
    if (chartRange === 'month') return date.getDate();
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTimer = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0m';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  // --- SKELETON COMPONENTS ---
  const Skeleton = ({ className }) => (
    <div className={`skeleton shimmer rounded-xl ${className}`} />
  );

  const HubSkeleton = () => (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-16 w-full md:w-64 rounded-3xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <Skeleton className="h-24 w-full rounded-[2.5rem]" />
          <Skeleton className="h-24 w-full rounded-[2.5rem]" />
          <Skeleton className="h-24 w-full rounded-[2.5rem]" />
          <Skeleton className="h-64 w-full rounded-[2.5rem]" />
        </div>
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Skeleton className="h-[500px] w-full rounded-[3rem]" />
            <Skeleton className="h-20 w-full rounded-[2.5rem]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-[350px] w-full rounded-[3rem]" />
            <Skeleton className="h-[350px] w-full rounded-[3rem]" />
          </div>
        </div>
      </div>
    </div>
  );

  const RankSkeleton = () => (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="glass-card rounded-[3rem] p-8 border border-white/5 space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );

  const RoutineSkeleton = () => (
    <div className="space-y-8 pb-32">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-48" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-12" />)}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-[400px] w-full rounded-[3rem]" />
        <Skeleton className="h-[400px] w-full rounded-[3rem]" />
      </div>
    </div>
  );

  const HistorySkeleton = () => (
    <div className="space-y-8 pb-32 max-w-4xl mx-auto">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
        </div>
        <div className="md:col-span-2">
          <Skeleton className="h-[500px] w-full rounded-[3rem]" />
        </div>
      </div>
    </div>
  );

  const renderRestrictedAccess = () => (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] border border-rose-500/10 shadow-[0_32px_100px_rgba(244,63,94,0.1)]">
      <div className="w-24 h-24 rounded-[32px] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-10 shadow-lg shadow-rose-500/5">
        <AlertCircle size={48} className="text-rose-500" />
      </div>
      <h2 className="text-4xl font-black text-rose-500 tracking-tighter uppercase italic leading-tight mb-6">
        Access<br />
        <span className="text-white">Temporarily Held</span>
      </h2>
      <p className="max-w-md text-zinc-400 font-bold uppercase tracking-[0.1em] text-[11px] leading-loose mb-12">
        Your access to the student portal has been temporarily suspended by the administration. To resolve this and restore your library benefits, please visit the <span className="text-rose-400 font-black tracking-widest">Library Admin Office</span> for a quick account update.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <a href="mailto:admin@institute.edu" className="px-10 py-5 bg-white text-black rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
          Contact Administration
        </a>
        <button onClick={handleLogout} className="px-10 py-5 bg-zinc-800 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] border border-white/5 shadow-2xl active:scale-95 transition-all">
          Exit Portal
        </button>
      </div>
    </div>
  );

  const renderProfileSettings = () => {
    return (
      <div className="space-y-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto px-4 sm:px-0">
        {/* Premium Profile Header */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-[#0c0c0e] rounded-[2.8rem] p-8 border border-white/5 flex flex-col items-center text-center shadow-2xl">
            <div className="relative mb-6">
              <input type="file" id="profile-upload" hidden accept="image/*" onChange={handleImageChange} />
              <label htmlFor="profile-upload" className="cursor-pointer block relative group/avatar">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center border-2 border-white/5 p-1 transition-all group-hover/avatar:border-blue-500/50">
                  <div className="w-full h-full rounded-full bg-[#111113] flex items-center justify-center text-blue-500 shadow-inner overflow-hidden">
                    {profileFormData.profileImage ? (
                      <img src={profileFormData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} strokeWidth={1.5} />
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-2xl bg-blue-600 hover:bg-blue-500 flex items-center justify-center border-4 border-[#0c0c0e] text-white shadow-lg transition-transform group-hover/avatar:scale-110">
                  <Camera size={14} />
                </div>
              </label>
            </div>
            
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">
              {profileFormData.fullName || user?.name || 'SYNC IDENTITY'}
            </h2>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
              <GraduationCap size={14} className="text-zinc-500" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                ID: {user?.id?.toString().padStart(4, '0') || '0000'} • STUDENT PORTAL
              </span>
            </div>
          </div>
        </div>

        {/* Categorized Info Cards */}
        <div className="space-y-6">
          {/* Section: Security & Access (Admin Managed) */}
          <div className="bg-[#1a1a1c]/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden group/card">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/card:opacity-[0.07] transition-opacity">
              <Shield size={140} />
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-500/10 flex items-center justify-center text-zinc-400 group-hover/card:bg-zinc-500/20 transition-all">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Security & Access</h3>
                  <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Managed by administration</p>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-1.5">
                <ShieldCheck size={10} className="text-blue-400" />
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none">Verified</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
              <div className="space-y-2 opacity-60">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Official Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                  <input readOnly value={profileFormData.email || ''} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-zinc-400 outline-none cursor-not-allowed" />
                </div>
              </div>
              <div className="space-y-2 opacity-60">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Registered Mobile</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                  <input readOnly value={profileFormData.mobile || ''} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-zinc-400 outline-none cursor-not-allowed" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Personal Profile */}
          <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-6 sm:p-8 space-y-6 shadow-xl group/card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover/card:bg-blue-500/20 transition-all">
                <User size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Personal Profile</h3>
                <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Identification details</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Your Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={14} />
                  <input name="fullName" value={profileFormData.fullName || ''} onChange={handleProfileChange} placeholder="Enter full name" className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:border-blue-500/50 outline-none transition-all shadow-inner" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Guardian Name</label>
                <div className="relative group">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={14} />
                  <input name="fatherName" value={profileFormData.fatherName || ''} onChange={handleProfileChange} placeholder="Father/Guardian Name" className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white focus:border-blue-500/50 outline-none transition-all shadow-inner" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Residential Details */}
          <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-6 sm:p-8 space-y-6 shadow-xl group/card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover/card:bg-indigo-500/20 transition-all">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Residential Details</h3>
                <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Current address info</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               <div className="col-span-2 space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Village/Locality</label>
                <input name="village" value={profileFormData.village || ''} onChange={handleProfileChange} placeholder="Village name" className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-xs font-bold text-white focus:border-blue-500/50 outline-none transition-all" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Post Office</label>
                <input name="post" value={profileFormData.post || ''} onChange={handleProfileChange} placeholder="P.O. Name" className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-xs font-bold text-white focus:border-blue-500/50 outline-none transition-all" />
              </div>
              <div className="col-span-1 space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">District</label>
                <input name="district" value={profileFormData.district || ''} onChange={handleProfileChange} placeholder="District" className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] font-bold text-white focus:border-blue-500/50 outline-none transition-all" />
              </div>
              <div className="col-span-1 space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">PIN Code</label>
                <input name="pincode" value={profileFormData.pincode || ''} onChange={handleProfileChange} placeholder="6-digit" className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] font-bold text-white focus:border-blue-500/50 outline-none transition-all" />
              </div>
              <div className="col-span-2 space-y-2">
                 <label className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Full Address</label>
                 <textarea name="address" value={profileFormData.address || ''} onChange={handleProfileChange} placeholder="Building, Street, Landmark..." className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-xs font-bold text-white h-20 focus:border-blue-500/50 outline-none transition-all resize-none" />
              </div>
            </div>
          </div>

          {/* Section: Professional Bio */}
          <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-6 sm:p-8 space-y-4 shadow-xl group/card">
             <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover/card:bg-violet-500/20 transition-all">
                <PenLine size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Aspiration & Bio</h3>
                <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Share your study goals</p>
              </div>
            </div>
            <textarea name="bio" value={profileFormData.bio || ''} onChange={handleProfileChange} placeholder="Tell us about your preparation or goals..." className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 text-sm font-medium text-white h-32 focus:border-blue-500/50 outline-none transition-all resize-none leading-relaxed" />
          </div>

          {/* Action Footer */}
          <div className="pt-8 space-y-4">
            <button
              onClick={handleRequestOtp}
              disabled={otpRequestPending || actionLoading}
              className="group relative w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-blue-500/40 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              {otpRequestPending ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
              {otpRequestPending ? 'Verifying...' : 'Save & Sync Profile'}
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-6 bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-white/5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <Power size={14} strokeWidth={3} />
              Exit Portal
            </button>
          </div>
        </div>

      </div>
    );
  };

  // --- VIEW RENDERING FUNCTIONS ---

  const renderStudyHub = () => (
    <div className="glass-card p-6 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-500/10 shadow-2xl overflow-hidden relative group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${pomodoro.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{pomodoro.mode === 'focus' ? 'Study Session' : 'Break'}</span>
        </div>
        <button onClick={() => setShowPomodoroSettings(!showPomodoroSettings)} className="text-gray-500 hover:text-indigo-400 transition-colors">
          <Settings size={14} />
        </button>
      </div>

      {showPomodoroSettings ? (
        <div className="space-y-4 py-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Focus (Min)</label>
              <input type="number" defaultValue={pomodoro.focusDuration} onBlur={(e) => handleUpdatePomodoroSettings(parseInt(e.target.value), pomodoro.breakDuration)} className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white text-xs outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Break (Min)</label>
              <input type="number" defaultValue={pomodoro.breakDuration} onBlur={(e) => handleUpdatePomodoroSettings(pomodoro.focusDuration, parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white text-xs outline-none focus:border-indigo-500" />
            </div>
          </div>
          <button onClick={() => setShowPomodoroSettings(false)} className="w-full py-2 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase rounded-xl hover:bg-indigo-500/20">Save Settings</button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="text-6xl font-black text-white tracking-tighter mb-6 font-mono tabular-nums">
            {formatTimer(pomodoro.timeLeft)}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleToggleTimer} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${pomodoro.isRunning ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'}`}>
              {pomodoro.isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </button>
            <button onClick={handleResetTimer} className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all active:scale-90">
              <RotateCcw size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Background Decor */}
      <div className="absolute -bottom-6 -right-6 text-indigo-500/5 pointer-events-none group-hover:scale-110 transition-transform">
        <Timer size={100} />
      </div>
    </div>
  );

  const renderDailyTasks = () => (
    <div className="glass-card rounded-[3rem] p-8 border border-white/5 shadow-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><CheckSquare size={20} /></div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Daily Tasks</h2>
            <div className="flex gap-2 mt-1">
              <button onClick={() => handleToggleTaskView('today')} className={`text-[8px] font-black uppercase tracking-widest ${taskView === 'today' ? 'text-indigo-500' : 'text-gray-600'}`}>Today</button>
              <button onClick={() => handleToggleTaskView('archived')} className={`text-[8px] font-black uppercase tracking-widest ${taskView === 'archived' ? 'text-orange-500' : 'text-gray-600'}`}>History</button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {taskView === 'today' && (
            <button
              onClick={handleSyncRoutine}
              disabled={actionLoading || !isInLibrary}
              className={`p-2 rounded-xl bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 transition-all ${actionLoading || !isInLibrary ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={isInLibrary ? "Sync Schedule" : "Check in to sync"}
            >
              <RefreshCcw size={16} className={actionLoading ? 'animate-spin' : ''} />
            </button>
          )}
          <span className="text-[10px] font-black text-gray-600 uppercase">
            {tasks.filter(t => t.isCompleted).length}/{tasks.length} DONE
          </span>
        </div>
      </div>

      <div className="relative flex-1 flex flex-col min-h-0">
        {!isInLibrary && taskView === 'today' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0B0D17]/60 backdrop-blur-[2px] rounded-[2rem] text-center p-6 border border-white/5">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4">
              <Camera size={32} className="animate-pulse" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-tighter mb-1">Locked</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">Scan QR at the library<br />to activate your plan.</p>
          </div>
        )}

        <div className="space-y-3 mb-6 flex-1 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar ${!isInLibrary && taskView === 'today' ? 'opacity-20 pointer-events-none grayscale' : ''}">

          {tasks.length === 0 && (
            <div className="text-center py-8 opacity-20">
              <CheckSquare size={40} className="mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest">No tasks</p>
            </div>
          )}
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.02] border group transition-all ${task.priority === 'high' ? 'border-orange-500/20' : 'border-white/5'}`}>
                <div className="flex items-center gap-4">
                  <button onClick={() => handleToggleTask(task.id, task.isCompleted)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-white/10 hover:border-indigo-500/50'}`}>
                    {task.isCompleted && <CheckSquare size={14} />}
                  </button>
                  <div className="flex-1">
                    {editingTask?.id === task.id ? (
                      <div className="space-y-3 bg-white/5 p-3 rounded-xl border border-white/10">
                        <input type="text" value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-xs text-white outline-none" placeholder="Task Title" />
                        <div className="flex flex-wrap gap-2">
                          <div className="flex bg-white/10 rounded-lg border border-white/20 p-1 flex-1">
                            <input type="number" value={editingTask.editHrs} onChange={(e) => setEditingTask({ ...editingTask, editHrs: e.target.value })} className="w-12 bg-transparent text-[10px] font-bold text-white outline-none px-1 text-center" placeholder="H" title="Hours" />
                            <div className="w-[1px] bg-white/20 h-3 self-center" />
                            <input type="number" value={editingTask.editMin} onChange={(e) => setEditingTask({ ...editingTask, editMin: e.target.value })} className="w-12 bg-transparent text-[10px] font-bold text-white outline-none px-1 text-center" placeholder="M" title="Minutes" />
                          </div>
                          <button onClick={handleUpdateTask} disabled={actionLoading} className={`bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${actionLoading ? 'opacity-50' : ''}`}>
                            {actionLoading ? 'SAVING...' : 'SAVE'}
                          </button>
                          <button onClick={() => setEditingTask(null)} disabled={actionLoading} className="bg-white/10 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">CANCEL</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className={`text-sm font-bold block transition-all ${task.isCompleted ? 'text-gray-600 line-through' : 'text-gray-300'}`}>{task.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{formatDuration(task.estimatedMinutes)}</span>
                          <div className={`w-1 h-1 rounded-full ${task.priority === 'high' ? 'bg-orange-500' : task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-600'}`} />
                        </div>
                      </>
                    )}
                  </div>
                  {!editingTask && (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleEditTask(task)} className="p-2 text-gray-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all">
                        <PenLine size={14} />
                      </button>
                      <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-red-500/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Task Timer Integration */}
                {!task.isCompleted && taskView === 'today' && !editingTask && (
                  <div className={`mt-2 p-3 rounded-xl flex items-center justify-between transition-all ${activeTaskTimer?.id === task.id ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-black/20'}`}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleStartTaskTimer(task)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeTaskTimer?.id === task.id && activeTaskTimer.isRunning ? 'bg-orange-500 text-white' : 'bg-indigo-600 text-white'}`}>
                        {activeTaskTimer?.id === task.id && activeTaskTimer.isRunning ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                      </button>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Timer</span>
                        <span className={`text-xs font-mono font-bold ${activeTaskTimer?.id === task.id && activeTaskTimer.isRunning ? 'text-orange-500' : 'text-gray-400'}`}>
                          {activeTaskTimer?.id === task.id ? formatTimer(activeTaskTimer.timeLeft) : formatTimer((task.estimatedMinutes || 0) * 60)}
                        </span>
                      </div>
                    </div>
                    {activeTaskTimer?.id === task.id && (
                      <button onClick={() => setActiveTaskTimer(null)} className="p-2 text-gray-600 hover:text-white">
                        <RotateCcw size={12} />
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {taskView === 'today' && (
          <form onSubmit={handleAddTask} className="relative mt-auto space-y-3">
            <input
              type="text"
              placeholder={isInLibrary ? "Add task..." : "Check in to add tasks..."}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              disabled={!isInLibrary}
              className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-12 text-sm font-bold text-white outline-none focus:border-indigo-500/50 transition-all shadow-inner ${!isInLibrary ? 'cursor-not-allowed opacity-50' : ''}`}
            />
            <div className={`flex flex-wrap gap-2 ${!isInLibrary ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex bg-white/5 rounded-xl border border-white/10 p-1 flex-1">
                <input type="number" placeholder="Hrs" value={newTaskHrs} onChange={(e) => setNewTaskHrs(e.target.value)} className="w-14 bg-transparent text-[10px] font-bold text-white outline-none px-2 text-center" />
                <div className="w-[1px] bg-white/10 h-4 self-center" />
                <input type="number" placeholder="Min" value={newTaskMin} onChange={(e) => setNewTaskMin(e.target.value)} className="w-14 bg-transparent text-[10px] font-bold text-white outline-none px-2 text-center" />
              </div>
              <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-[10px] font-bold text-gray-500 outline-none flex-1 min-w-[100px]">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button type="submit" disabled={actionLoading || !isInLibrary} className={`p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-500/10 transition-all active:scale-90 ${actionLoading || !isInLibrary ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <PlusCircle size={20} />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  const renderHub = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter">
            👋 <span className="text-blue-500 uppercase">{user?.name?.split(' ')[0] || 'STUDENT'}</span>
          </h1>
          <div className="flex items-center gap-2 mt-1 opacity-80">
            <span className={`w-2 h-2 rounded-full animate-pulse ${todayStatus?.status === 'In Library' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
            <span className={`text-[12px] font-black uppercase tracking-[0.2em] ${todayStatus?.status === 'In Library' ? 'text-emerald-400' : 'text-orange-400'}`}>
              {todayStatus?.status || 'Awaiting Sync'}
            </span>
          </div>
        </div>

        {/* Live Status Card */}
        <div className={`p-1 rounded-3xl transition-all duration-700 ${todayStatus?.status === 'In Library' ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20' : 'bg-white/5'}`}>
          <div className="bg-[#0B0D17] rounded-[1.4rem] px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Status</span>
              <div className="flex items-center gap-3">
                <span className={`text-lg sm:text-xl font-black ${todayStatus?.status === 'In Library' ? 'text-emerald-400' : 'text-white'}`}>
                  {todayStatus?.status === 'In Library' ? 'ACTIVE' : todayStatus?.status === 'Completed' ? 'COMPLETE' : 'OFFLINE'}
                </span>
              </div>
            </div>

            {todayStatus?.status === 'In Library' && (
              <div className="flex gap-6 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6">
                <div>
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Check-in</span>
                  <span className="text-sm font-black text-white">{formatTime(todayStatus.checkIn)}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Elapsed</span>
                  <span className="text-sm font-black text-blue-500">{getElapsedTime(todayStatus.checkIn)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Stats */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-8">
          {renderFeeStatusCard()}
          <div className="glass-card p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                <Flame size={24} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Streak</span>
                <span className="text-xl font-black text-white tracking-tighter">{metrics?.currentStreak || 0} DAYS</span>
              </div>
            </div>
            <button onClick={() => setActiveView('rank')} className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all">
              <Trophy size={20} />
            </button>
          </div>

          <div className="glass-card p-8 rounded-[3rem] bg-gradient-to-br from-blue-600/5 to-transparent border border-white/5 relative overflow-hidden shadow-2xl">
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 relative mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: Math.min(todayStatus?.studyHours || 0, metrics?.dailyGoalHours || 8) },
                        { name: 'Remaining', value: Math.max((metrics?.dailyGoalHours || 8) - (todayStatus?.studyHours || 0), 0) }
                      ]}
                      innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none"
                    >
                      <Cell fill="#3B82F6" />
                      <Cell fill="rgba(255,255,255,0.03)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-white tracking-tighter">
                    {Math.round(((todayStatus?.studyHours || 0) / (metrics?.dailyGoalHours || 8)) * 100)}%
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Goal</span>
                </div>
              </div>
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.03] border border-white/5">
                  <div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Target</span>
                    <span className="text-2xl font-black text-white tracking-tighter">{metrics?.dailyGoalHours || 8}H</span>
                  </div>
                  <button onClick={() => { setTempGoal(metrics?.dailyGoalHours || 8); setActiveModal('goal'); }} className="p-4 bg-blue-600/10 text-blue-500 rounded-2xl">
                    <Settings size={22} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.03] border border-white/5">
                  <div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Actual</span>
                    <span className="text-2xl font-black text-blue-500 tracking-tighter">{todayStatus?.studyHours?.toFixed(1) || 0}H</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-500">
                    <Clock size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {renderStudyHub()}
        </div>

        {/* Right Analytics & Tasks */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="xl:col-span-1">
              {renderDailyTasks()}
            </div>

            <div className="xl:col-span-1">
              <div className="glass-card p-6 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Zap size={24} />
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Analysis</h2>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="glass-card rounded-[3rem] p-5 sm:p-8 border border-white/5 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500"><TrendingUp size={20} /></div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Velocity</h2>
              </div>
              <div className="h-[250px] min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                  <BarChart data={getProcessedChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey={chartRange === 'year' ? 'label' : 'date'} axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 10, fontWeight: '800' }} tickFormatter={getRangeLabel} />
                    <YAxis hide domain={[0, 'auto']} />
                    <ReTooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#0c0c0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '10px' }} />
                    <Bar dataKey="studyHours" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-[3rem] p-5 sm:p-8 border border-white/5 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><LayoutGrid size={20} /></div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Subjects</h2>
              </div>
              <div className="h-[250px] min-h-[250px]">
                {subjectAnalytics.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                    <PieChart>
                      <Pie data={subjectAnalytics} dataKey="hours" nameKey="subject" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5}>
                        {subjectAnalytics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'][index % 5]} />
                        ))}
                      </Pie>
                      <ReTooltip contentStyle={{ backgroundColor: '#0c0c0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-20">
                    <Activity size={40} className="mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Data</p>
                  </div>
                )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderRank = () => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8 pb-32 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Global <span className="text-zinc-600">Rankings</span></h2>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-2">Current Leaderboard</p>
      </div>

      <div className="space-y-4">
        {leaderboard.map((item, index) => (
          <div key={item.id} className={`flex items-center gap-5 p-6 rounded-[2.5rem] border transition-all ${index < 1 ? 'bg-blue-600/10 border-blue-500/20' : 'bg-white/[0.02] border-white/5'}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-black text-2xl ${index === 0 ? 'bg-orange-500 text-white' : index === 1 ? 'bg-slate-400 text-white' : index === 2 ? 'bg-amber-600 text-white' : 'bg-white/10 text-gray-600'}`}>
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="text-xl font-black text-white tracking-tight leading-none">{item.fullName}</div>
              <div className="flex items-center gap-2 mt-2">
                <Flame size={14} className="text-orange-500" />
                <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{item.currentStreak} Day Streak</span>
              </div>
            </div>
            {index < 3 && <Award size={32} className={index === 0 ? 'text-orange-400' : index === 1 ? 'text-slate-300' : 'text-amber-500'} />}
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderRoutineBuilder = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-12 pb-32 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Weekly <span className="text-indigo-500">Schedule</span></h2>
          <p className="text-zinc-500 text-sm mt-3 font-medium">Design your recurring study sessions per day.</p>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-4 custom-scrollbar no-scrollbar">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, idx) => (
          <button key={day} onClick={() => setRoutineDay(idx)} className={`min-w-[70px] p-4 rounded-2xl border transition-all flex flex-col items-center gap-1 ${routineDay === idx ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 border-white/10 text-gray-500'}`}>
            <span className="text-[8px] font-black uppercase tracking-widest">{day}</span>
            <span className="text-xs font-black italic">{weeklyRoutine.filter(r => r.dayOfWeek === idx).length} Subjects</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><PenLine size={20} /></div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Plan Subject</h3>
          </div>

          <form onSubmit={handleAddScheduleItem} className="glass-card p-8 rounded-[3rem] bg-white/[0.03] border border-white/5 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Subject</label>
              <input type="text" placeholder="e.g., Mathematics" value={newRoutineSubject} onChange={(e) => setNewRoutineSubject(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Hours</label>
                <input type="number" placeholder="2" value={newRoutineHrs} onChange={(e) => setNewRoutineHrs(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-black text-white outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Minutes</label>
                <input type="number" placeholder="30" value={newRoutineMin} onChange={(e) => setNewRoutineMin(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-black text-white outline-none" />
              </div>
            </div>

            <button type="submit" disabled={actionLoading} className={`w-full py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[2rem] shadow-xl hover:bg-indigo-500 transition-all active:scale-95 flex items-center justify-center gap-3 ${actionLoading ? 'opacity-50 pointer-events-none' : ''}`}>
              {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
              Add
            </button>
          </form>
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500"><LayoutGrid size={20} /></div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Active Schedule</h3>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
            {weeklyRoutine.filter(r => r.dayOfWeek === routineDay).length === 0 ? (
              <div className="text-center py-20 opacity-20 bg-white/[0.01] rounded-[3rem] border border-dashed border-white/10">
                <Calendar size={40} className="mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">No subjects</p>
              </div>
            ) : (
              weeklyRoutine.filter(r => r.dayOfWeek === routineDay).map(node => (
                <div key={node.id} className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/5 flex items-center justify-between group">
                  <div>
                    <span className="text-lg font-bold text-white block leading-none">{node.subject}</span>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2 block">{formatDuration(node.estimatedMinutes)}</span>
                  </div>
                  <button onClick={() => handleRemoveScheduleItem(node.id)} className="p-3 text-red-500/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderJournal = () => (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-10 pb-32 max-w-2xl mx-auto">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Study <span className="text-blue-500">Journal</span></h2>
        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Log your productivity metrics</p>
      </div>

      <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-8 sm:p-12 shadow-2xl">
        <form onSubmit={handleManualJournalSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Core Subject</label>
            <input
              type="text"
              required
              placeholder="e.g. Physics, Advanced Mathematics"
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white focus:border-blue-500/50 outline-none transition-all placeholder:text-white/10"
              value={logFormData.subject}
              onChange={(e) => setLogFormData({ ...logFormData, subject: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Topics Accomplished</label>
            <textarea
              required
              placeholder="What specifically did you achieve in this session?"
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white h-32 focus:border-blue-500/50 outline-none transition-all resize-none placeholder:text-white/10"
              value={logFormData.topicsCovered}
              onChange={(e) => setLogFormData({ ...logFormData, topicsCovered: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Duration (Hours)</label>
              <input
                type="number"
                step="0.1"
                required
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white focus:border-blue-500/50 outline-none transition-all"
                value={logFormData.hoursSpent}
                onChange={(e) => setLogFormData({ ...logFormData, hoursSpent: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Productivity Rating (1-10)</label>
              <select
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white focus:border-blue-500/50 outline-none transition-all appearance-none"
                value={logFormData.productivityRating}
                onChange={(e) => setLogFormData({ ...logFormData, productivityRating: parseInt(e.target.value) })}
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1} className="bg-zinc-900">{i + 1} - {i < 3 ? 'low' : i < 7 ? 'medium' : 'peak'}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
          >
            {actionLoading ? 'Synchronizing...' : 'Finalize Entry'}
          </button>
        </form>
      </div>
    </motion.div>
  );
  const renderHistory = () => {
    const selectedRecord = selectedHistoryDate ? history.find(h => h.date?.split('T')[0] === selectedHistoryDate?.split('T')[0]) : null;

    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8 pb-32 max-w-4xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Study <span className="text-zinc-600">History</span></h2>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-2">Your Past Sessions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar: Calendar & Recent Sessions */}
          <div className="md:col-span-1 space-y-8">
            <div className="space-y-4 mb-6 px-2">
              <div className="relative group">
                <input
                  type="date"
                  value={selectedHistoryDate ? selectedHistoryDate.split('T')[0] : ''}
                  onChange={(e) => handleSelectHistoryDate(e.target.value)}
                  className="w-full h-full absolute inset-0 opacity-0 z-20 cursor-pointer"
                />
                <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between text-[10px] font-black uppercase text-white group-hover:border-emerald-500/50 transition-all">
                  <span className={selectedHistoryDate ? 'text-white' : 'text-gray-500'}>
                    {selectedHistoryDate
                      ? new Date(selectedHistoryDate).toLocaleDateString('en-GB').replace(/\//g, '-')
                      : 'DD-MM-YYYY'}
                  </span>
                  <Calendar size={14} className="text-emerald-500" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <Calendar size={18} className="text-emerald-500" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent</span>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {history.map((record) => (
                  <button key={record.id} onClick={() => handleSelectHistoryDate(record.date)} className={`w-full p-5 rounded-[2rem] border transition-all text-left flex flex-col gap-1 ${selectedHistoryDate === record.date ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-gray-400 hover:border-emerald-500/30'}`}>
                    <span className="text-xs font-black italic">{new Date(record.date).toLocaleDateString()}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{record.studyHours?.toFixed(1) || 0}H Total</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content: Session Details */}
          <div className="md:col-span-2">
            {selectedHistoryDate ? (
              <div className="glass-card p-8 rounded-[3rem] border border-white/5 bg-white/[0.02] min-h-[400px]">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-white italic truncate">{new Date(selectedHistoryDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1">Session Detail</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-3 opacity-40">
                    <div className="h-[1px] flex-1 bg-white" />
                    <span className="text-[8px] font-black uppercase tracking-[0.3em]">Summary</span>
                    <div className="h-[1px] flex-1 bg-white" />
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="p-6 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-2">Total Time</span>
                      <span className="text-4xl font-black text-white italic tracking-tighter">
                        {selectedRecord?.studyHours?.toFixed(1) || 0} <span className="text-lg">HOURS</span>
                      </span>
                    </div>

                    <div className="p-8 rounded-[3rem] bg-indigo-500/5 border border-white/5">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><PenLine size={16} /></div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Tasks</h4>
                      </div>

                      <div className="space-y-3">
                        {historyTasks.length === 0 ? (
                          <p className="text-[10px] text-gray-400 font-bold italic text-center py-4 uppercase tracking-widest opacity-40">No entries</p>
                        ) : (
                          historyTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 transition-colors hover:bg-white/[0.05]">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${task.isCompleted ? 'bg-emerald-500' : 'bg-white/20'}`} />
                                <span className={`text-xs font-bold ${task.isCompleted ? 'text-white' : 'text-gray-500'}`}>{task.title}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {task.estimatedMinutes && <span className="text-[9px] text-gray-600 font-bold uppercase">{formatDuration(task.estimatedMinutes)}</span>}
                                <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase ${task.isCompleted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-gray-600'}`}>
                                  {task.isCompleted ? 'Done' : 'Pending'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold text-center mt-4 italic">"Study records are verified and finalized."</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 glass-card rounded-[3rem] border border-dashed border-white/10 opacity-30 h-full">
                <History size={48} className="mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-center">Select a date to view session details</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0D17] text-gray-300 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Top Bar */}
      <nav className="relative z-50 border-b border-white/5 bg-[#0B0D17]/50 backdrop-blur-xl sticky top-0 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <GraduationCap size={22} />
            </div>
            <span className="text-xl font-black text-white tracking-tighter uppercase italic">Study<span className="text-blue-500">Vault</span></span>
          </div>

          <div className="flex items-center gap-3">
            {!isRestricted && (
              <button
                onClick={() => setActiveView('profile')}
                className={`p-3 rounded-2xl transition-all ${activeView === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-gray-500 hover:text-white'}`}
              >
                <Settings size={18} />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-8 pb-20">
        <AnimatePresence mode="wait">
          {isRestricted ? (
            <motion.div key="restricted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              {renderRestrictedAccess()}
            </motion.div>
          ) : loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {activeView === 'hub' && <HubSkeleton />}
              {activeView === 'rank' && <RankSkeleton />}
              {activeView === 'routine' && <RoutineSkeleton />}
              {activeView === 'history' && <HistorySkeleton />}
            </motion.div>
          ) : (
            <>
              {activeView === 'hub' && renderHub()}
              {activeView === 'rank' && renderRank()}
              {activeView === 'journal' && renderJournal()}
              {activeView === 'routine' && renderRoutineBuilder()}
              {activeView === 'history' && renderHistory()}
              {activeView === 'profile' && renderProfileSettings()}
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Alarm Notification Overlay */}
      <AnimatePresence>
        {isAlarmActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-[#0B0D17]/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-sm bg-red-600 rounded-[2.5rem] p-8 shadow-[0_0_80px_rgba(239,68,68,0.5)] flex flex-col items-center gap-6 border border-red-500/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-white/20 animate-pulse" />

              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white relative">
                <div className="absolute inset-0 bg-white/5 rounded-full animate-ping" />
                <Timer size={40} className="animate-bounce" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Goal Reached</h3>
                <p className="text-[11px] text-white/70 font-black uppercase tracking-[0.2em]">Study Session Completed</p>
              </div>

              <div className="w-full h-[1px] bg-white/10" />

              <button onClick={stopAlarm} className="w-full py-5 bg-white text-red-600 font-black text-sm uppercase tracking-[0.3em] rounded-2xl shadow-2xl active:scale-95 transition-all hover:bg-gray-100">
                Deactivate Alert
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HOTSTAR STYLE NAVIGATION BAR --- */}
      {!isRestricted && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-4">
          <div className="bg-[#0B0D17]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 flex items-center justify-between shadow-[0_25px_50px_-12px_rgba(59,130,246,0.3)]">
            <button onClick={() => setActiveView('hub')} className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${activeView === 'hub' ? 'text-blue-500 scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
              <LayoutGrid size={24} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-center w-full">Hub</span>
            </button>

            <button onClick={() => setActiveView('rank')} className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${activeView === 'rank' ? 'text-blue-500 scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
              <Trophy size={24} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-center w-full">Rank</span>
            </button>

            <div className="flex-1 flex justify-center h-10 items-end">
              <button onClick={() => setActiveModal('qr')} className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all active:scale-90 -mb-2 border-4 border-[#0B0D17] flex-shrink-0 ${activeModal === 'qr' ? 'bg-indigo-600 scale-110' : todayStatus?.status === 'In Library' ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}>
                <Camera size={28} />
              </button>
            </div>

            <button onClick={() => setActiveView('routine')} className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${activeView === 'routine' ? 'text-blue-500 scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
              <Calendar size={24} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-center w-full">Routine</span>
            </button>

            <button onClick={() => setActiveView('history')} className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${activeView === 'history' ? 'text-blue-500 scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
              <History size={24} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-center w-full">Vault</span>
            </button>
          </div>
        </div>
      )}

      {/* --- OVERLAYS --- */}
      <AnimatePresence>
        {activeModal === 'qr' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModal(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-zinc-900 border border-white/10 p-8 rounded-[3rem] w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white">Attendance Scan</h3>
                <button onClick={() => setActiveModal(null)} className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-white"><XCircle size={20} /></button>
              </div>
              <div className="bg-black/50 rounded-[2rem] mb-6 overflow-hidden border border-white/5 h-[300px] relative">
                <Scanner onScan={handleScanSuccess} components={{ audio: false, finder: true }} styles={{ container: { width: '100%', height: '100%' } }} />
              </div>
              <button onClick={() => setActiveModal(null)} className="w-full py-4 rounded-2xl bg-white/5 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:bg-white/10">Terminate Scan</button>
            </motion.div>
          </div>
        )}

        {activeModal === 'goal' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModal(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-zinc-900 border border-white/10 p-8 rounded-[3rem] w-full max-w-sm overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Daily Target</h3>
                <button onClick={() => setActiveModal(null)} className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-white"><XCircle size={20} /></button>
              </div>
              <div className="space-y-8">
                <div className="grid grid-cols-4 gap-2">
                  {[6, 8, 10, 12].map(hrs => (
                    <button key={hrs} onClick={() => setTempGoal(hrs)} className={`py-4 rounded-2xl text-xs font-black border transition-all ${Number(tempGoal) === hrs ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 border-white/5 text-gray-500'}`}>{hrs}H</button>
                  ))}
                </div>
                <input type="number" value={tempGoal} onChange={(e) => setTempGoal(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-4xl font-black text-center text-white focus:border-blue-500 outline-none" />
                <div className="flex gap-3">
                  <button onClick={() => setActiveModal(null)} className="flex-1 py-5 bg-white/5 text-gray-500 font-bold rounded-2xl">Abort</button>
                  <button onClick={handleUpdateGoal} disabled={actionLoading} className={`flex-2 px-8 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 ${actionLoading ? 'opacity-50' : ''}`}>
                    {actionLoading ? 'SYNCING...' : 'Sync Goal'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeModal === 'profile_otp' && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModal(null)} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#0c0c0e] border border-white/10 p-10 rounded-[3rem] w-full max-w-sm text-center">
              <div className="w-20 h-20 rounded-[28px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8">
                <ShieldCheck size={40} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Authorize Sync</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-10 leading-loose">
                Institutional security protocol in effect.<br />Enter the 6-digit sync cipher sent to {user?.email}
              </p>

              <input
                type="text"
                maxLength={6}
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                placeholder="000000"
                className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-4xl font-black text-center text-white tracking-[0.5em] focus:border-emerald-500 outline-none mb-10"
              />

              <div className="flex gap-4">
                <button onClick={() => setActiveModal(null)} className="flex-1 py-5 bg-white/5 text-zinc-500 font-bold rounded-2xl text-[10px] uppercase tracking-widest transition-all">Cancel</button>
                <button
                  onClick={handleVerifyAndUpdate}
                  disabled={actionLoading}
                  className="flex-2 px-10 py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 text-[10px] uppercase tracking-[0.2em] transition-all disabled:opacity-50 hover:bg-emerald-500 active:scale-95"
                >
                  {actionLoading ? 'SYNCING...' : 'Verify & Update'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
