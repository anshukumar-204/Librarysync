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
  ChevronLeft,
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
  Smartphone,
  MapPin,
  Mail,
  Phone,
  Shield,
  Power,
  IndianRupee,
  CreditCard,
  Lock,
  Receipt,
  ArrowRightLeft,
  X
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
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';
import ActiveSessions from '../components/ActiveSessions';

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
    actionLoading,
    historyTasksLoading
  } = useSelector((state) => state.studentDashboard);
  const { status: feeStatus } = useSelector((state) => state.fees);

  const isRestricted = user?.status?.toLowerCase() === 'inactive' || user?.status?.toLowerCase() === 'hold';
  const isInLibrary = todayStatus?.status === 'In Library' || todayStatus?.status === 'Checked In';

  useEffect(() => {
    if (isRestricted) {
      setActiveModal(null);
    }
  }, [isRestricted]);

  const [activeView, setActiveView] = React.useState('hub'); // 'hub' | 'rank' | 'journal' | 'history' | 'routine' | 'profile'
  const [activeModal, setActiveModal] = React.useState(null); // 'attendance' | 'profile' | 'ledger'
  const [ledgerTab, setLedgerTab] = React.useState('cycles'); // 'cycles' | 'journal'
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
  const [tempGoal, setTempGoal] = React.useState(8);
  const [isCustomPomodoro, setIsCustomPomodoro] = React.useState(false);
  const [customPomodoroMins, setCustomPomodoroMins] = React.useState('25');

  const formatStudyTime = (hours) => {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const normalizeDateKey = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value.split('T')[0];
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
  };

  const parseDurationMinutes = (value) => {
    if (value == null || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value));
    if (typeof value !== 'string') return null;

    const trimmedValue = value.trim().toLowerCase();
    if (!trimmedValue) return null;

    if (/^\d+(\.\d+)?$/.test(trimmedValue)) {
      return Math.max(0, Math.round(Number(trimmedValue)));
    }

    const hoursMatch = trimmedValue.match(/(\d+(?:\.\d+)?)\s*h/);
    const minutesMatch = trimmedValue.match(/(\d+(?:\.\d+)?)\s*m/);
    if (!hoursMatch && !minutesMatch) return null;

    const hours = hoursMatch ? Number(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;
    return Math.max(0, Math.round((hours * 60) + minutes));
  };

  const getLibraryDurationMinutes = (record, fallbackEndTime = Date.now()) => {
    if (!record) return 0;

    const minuteFields = [
      'libraryMinutes',
      'totalLibraryMinutes',
      'durationMinutes',
      'totalMinutes',
      'elapsedMinutes',
      'timeSpentMinutes'
    ];

    for (const key of minuteFields) {
      const parsedMinutes = parseDurationMinutes(record[key]);
      if (parsedMinutes != null) return parsedMinutes;
    }

    const hourFields = ['libraryHours', 'totalHours', 'durationHours'];
    for (const key of hourFields) {
      const rawValue = record[key];
      if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
        return Math.max(0, Math.round(rawValue * 60));
      }
    }

    const durationFields = ['libraryDuration', 'duration', 'totalDuration', 'timeSpent', 'sessionDuration'];
    for (const key of durationFields) {
      const parsedMinutes = parseDurationMinutes(record[key]);
      if (parsedMinutes != null) return parsedMinutes;
    }

    const checkInTime = record.checkIn || record.checkInTime || record.inTime;
    const checkOutTime = record.checkOut || record.checkOutTime || record.outTime || record.exitTime;

    if (checkInTime) {
      const startTime = new Date(checkInTime).getTime();
      const endTime = checkOutTime ? new Date(checkOutTime).getTime() : fallbackEndTime;

      if (!Number.isNaN(startTime) && !Number.isNaN(endTime) && endTime >= startTime) {
        return Math.max(0, Math.floor((endTime - startTime) / (1000 * 60)));
      }
    }

    if (typeof record.studyHours === 'number' && Number.isFinite(record.studyHours)) {
      return Math.max(0, Math.round(record.studyHours * 60));
    }

    return 0;
  };

  const formatLibraryDuration = (minutes) => {
    const safeMinutes = Math.max(0, Math.round(minutes || 0));
    const hours = Math.floor(safeMinutes / 60);
    const mins = safeMinutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

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
  const pomodoroTargetTime = React.useRef(null);
  const audioCtx = React.useRef(null);
  const audioOsc = React.useRef(null);

  const [routineDay, setRoutineDay] = React.useState(new Date().getDay());
  const [newRoutineSubject, setNewRoutineSubject] = React.useState('');
  const [newRoutineHrs, setNewRoutineHrs] = React.useState('');
  const [newRoutineMin, setNewRoutineMin] = React.useState('');
  const [selectedHistoryDate, setSelectedHistoryDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [libraryElapsedNow, setLibraryElapsedNow] = React.useState(Date.now());
  const [analyticsRange, setAnalyticsRange] = React.useState('7D'); // '7D', '30D', '90D', '1Y'
  const [heatmapIntensity, setHeatmapIntensity] = React.useState({});
  const [selectedStatsDate, setSelectedStatsDate] = React.useState(new Date());

  const todayDateKey = normalizeDateKey(new Date());
  const selectedHistoryDateKey = normalizeDateKey(selectedHistoryDate);
  const selectedHistoryRecord = Array.isArray(history)
    ? history.find((record) => normalizeDateKey(record?.date) === selectedHistoryDateKey)
    : null;
  const selectedNodeIsToday = selectedHistoryDateKey === todayDateKey;
  const selectedNodeIsLive = selectedNodeIsToday && isInLibrary && Boolean(todayStatus?.checkIn || todayStatus?.checkInTime);
  const selectedLibraryMinutes = selectedNodeIsLive
    ? getLibraryDurationMinutes(todayStatus, libraryElapsedNow)
    : getLibraryDurationMinutes(selectedHistoryRecord);
  const selectedLibraryStatus = selectedNodeIsLive
    ? 'Live session in progress'
    : selectedHistoryRecord?.checkOut || selectedHistoryRecord?.checkOutTime || selectedHistoryRecord?.outTime
      ? 'Session saved in attendance history'
      : 'Session time loaded from your history';

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedNodeIsLive) return undefined;

    setLibraryElapsedNow(Date.now());
    const interval = setInterval(() => {
      setLibraryElapsedNow(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedNodeIsLive]);

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

  // Precision Pomodoro Ticker
  useEffect(() => {
    let interval;
    if (pomodoro.isRunning) {
      if (!pomodoroTargetTime.current) {
        pomodoroTargetTime.current = Date.now() + (pomodoro.timeLeft * 1000);
      }

      interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((pomodoroTargetTime.current - Date.now()) / 1000));

        if (remaining > 0) {
          // Only update if time actually changed (to prevent unnecessary re-renders)
          if (remaining !== pomodoro.timeLeft) {
            dispatch(updatePomodoro({ timeLeft: remaining }));
          }
        } else {
          handleTimerComplete('Focus Timer');
          pomodoroTargetTime.current = null;
          clearInterval(interval);
        }
      }, 500); // Check every 500ms for better accuracy
    } else {
      pomodoroTargetTime.current = null;
    }
    return () => clearInterval(interval);
  }, [pomodoro.isRunning, dispatch]);

  // Task Timer Ticker
  useEffect(() => {
    let interval;
    if (activeTaskTimer?.isRunning) {
      interval = setInterval(() => {
        setActiveTaskTimer(prev => {
          if (!prev || !prev.isRunning) return prev;
          if (prev.timeLeft <= 1) {
            clearInterval(interval);
            return { ...prev, timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTaskTimer?.isRunning, activeTaskTimer?.id]);

  useEffect(() => {
    if (activeTaskTimer?.timeLeft === 0 && activeTaskTimer?.isRunning) {
      const targetTask = tasks.find(t => t.id === activeTaskTimer.id);
      handleTimerComplete(`Task: ${targetTask?.title || 'Task'}`);
      if (targetTask && !targetTask.isCompleted) {
        handleToggleTask(targetTask.id, false);
      }
      setActiveTaskTimer(null);
    }
  }, [activeTaskTimer?.timeLeft, activeTaskTimer?.isRunning, activeTaskTimer?.id]);

  const handleTimerComplete = (source) => {
    if (pomodoro.isRunning) {
      handlePomodoroComplete();
    }
    triggerAlarm(source);

    // BACKGROUND DISPATCH: Send system notification if user is away
    if (document.visibilityState === 'hidden') {
      sendSystemNotification(source);
    }
  };

  const sendSystemNotification = (source) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const options = {
      body: `${source} is complete. Open the app to continue.`,
      icon: '/pwa-192x192.png',
      vibrate: [500, 200, 500],
      tag: 'timer-alert',
      requireInteraction: true
    };

    // Use Service Worker if available for better background support
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(`Timer complete`, options);
      });
    } else {
      new Notification(`Timer complete`, options);
    }
  };

  const triggerAlarm = (source) => {
    setIsAlarmActive(true);
    toast.error(`${source} completed`, { duration: 6000 });

    // 1. START AUDIO ALARM (Synthetic)
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (audioCtx.current.state === 'suspended') {
        audioCtx.current.resume();
      }

      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();

      osc.type = 'square'; // Aggressive square wave
      osc.frequency.setValueAtTime(880, audioCtx.current.currentTime); // A5 note

      // Pulsing volume effect
      gain.gain.setValueAtTime(0, audioCtx.current.currentTime);
      gain.gain.setTargetAtTime(0.5, audioCtx.current.currentTime, 0.1);

      // Create a beep-beep-beep effect
      const interval = 0.5;
      for (let i = 0; i < 100; i++) {
        gain.gain.setValueAtTime(0.5, audioCtx.current.currentTime + (i * interval));
        gain.gain.setValueAtTime(0, audioCtx.current.currentTime + (i * interval) + 0.25);
      }

      osc.connect(gain);
      gain.connect(audioCtx.current.destination);
      osc.start();
      audioOsc.current = osc;
    } catch (err) {
      console.error("Audio failed:", err);
    }

    // 2. RECURSIVE VIBRATION (Hardware Alert)
    const startVibration = () => {
      if (navigator.vibrate) {
        // Aggressive pattern: Vibrate 800ms, pause 200ms, repeat
        navigator.vibrate([800, 200, 800, 200, 800]);
      }
    };

    startVibration();
    vibrationInterval.current = setInterval(startVibration, 2500);
  };

  const stopAlarm = () => {
    setIsAlarmActive(false);

    // Stop Audio
    if (audioOsc.current) {
      try {
        audioOsc.current.stop();
        audioOsc.current.disconnect();
        audioOsc.current = null;
      } catch (err) { }
    }

    // Stop Vibration
    if (vibrationInterval.current) {
      clearInterval(vibrationInterval.current);
      vibrationInterval.current = null;
    }
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
    toast.success("Timer stopped.");
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
      toast.success("Focus session completed. Time for a short break.");
      const focusedHours = (pomodoro.focusDuration / 60).toFixed(1);
      setLogFormData(prev => ({
        ...prev,
        hoursSpent: ((parseFloat(prev.hoursSpent) || 0) + parseFloat(focusedHours)).toFixed(1),
        topicsCovered: prev.topicsCovered + `\n- Focus session: ${pomodoro.focusDuration}m completed`
      }));
    } else {
      toast.success("Break finished. You can start the next focus session.");
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
    toast.success("Timer settings updated.");
  };

  const handleToggleTimer = () => {
    const nextRunning = !pomodoro.isRunning;

    // Request notification permission when starting the timer
    if (nextRunning && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    dispatch(updatePomodoro({ isRunning: nextRunning }));
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
      toast.success("Task added.");
    } catch (err) {
      toast.error("Failed to add task");
    }
  };

  const handleSyncRoutine = async () => {
    try {
      await dispatch(syncRoutine()).unwrap();
      toast.success("Study schedule updated.");
    } catch (err) {
      toast.error(typeof err === 'string' ? err : (err?.message || "Could not sync routine"));
    }
  };

  const handleSelectHistoryDate = (date) => {
    setSelectedHistoryDate(date);
  };

  useEffect(() => {
    if (selectedHistoryDate) {
      dispatch(fetchHistoryTasks(selectedHistoryDate));
    }
  }, [selectedHistoryDate, dispatch]);

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
      toast.error("Could not update task status");
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
      toast.success("Daily goal updated.");
    } catch (err) {
      toast.error(typeof err === 'string' ? err : (err?.message || "Could not update goal"));
    }
  };


  // --- ANALYTICS PROCESSING LOGIC ---
  const getAggregatedAnalytics = () => {
    if (!history || history.length === 0) return [];

    const data = [];
    const baseDate = new Date(selectedStatsDate);

    if (analyticsRange === '7D') {
      // Calendar Week: Sunday to Saturday
      const dayOfWeek = baseDate.getDay();
      const sun = new Date(baseDate);
      sun.setDate(baseDate.getDate() - dayOfWeek);
      sun.setHours(0, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const d = new Date(sun);
        d.setDate(sun.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const record = history.find(r => r.date.split('T')[0] === dateStr);
        data.push({
          date: dateStr,
          label: d.toLocaleDateString(undefined, { weekday: 'short' }),
          hours: record ? (record.studyHours || 0) : 0,
          fullDate: d.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })
        });
      }
    } else if (analyticsRange === '30D') {
      // Calendar Month: 1st to End
      const month = baseDate.getMonth();
      const year = baseDate.getFullYear();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const dateStr = d.toISOString().split('T')[0];
        const record = history.find(r => r.date.split('T')[0] === dateStr);
        data.push({
          date: dateStr,
          label: i.toString(),
          hours: record ? (record.studyHours || 0) : 0,
          fullDate: d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
        });
      }
    } else if (analyticsRange === '90D') {
      // Last 3 Calendar Months
      for (let m = 2; m >= 0; m--) {
        const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - m, 1);
        const monthName = d.toLocaleDateString(undefined, { month: 'short' });

        // Sum total hours for this month
        const recordsInMonth = history.filter(r => {
          const rd = new Date(r.date);
          return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
        });
        const total = recordsInMonth.reduce((acc, curr) => acc + (curr.studyHours || 0), 0);

        data.push({
          date: d.toISOString(),
          label: monthName,
          hours: total,
          fullDate: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        });
      }
    } else if (analyticsRange === '1Y') {
      // Calendar Year: Jan to Dec
      const year = baseDate.getFullYear();
      for (let i = 0; i < 12; i++) {
        const d = new Date(year, i, 1);
        const monthLabel = d.toLocaleDateString(undefined, { month: 'short' });
        const recordsInMonth = history.filter(r => {
          const rd = new Date(r.date);
          return rd.getMonth() === i && rd.getFullYear() === year;
        });
        const total = recordsInMonth.reduce((acc, curr) => acc + (curr.studyHours || 0), 0);
        data.push({
          date: d.toISOString(),
          label: monthLabel,
          hours: total,
          fullDate: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        });
      }
    }
    return data;
  };

  useEffect(() => {
    if (history && history.length > 0) {
      const intensityMap = {};
      history.forEach(record => {
        const dateKey = record.date.split('T')[0];
        intensityMap[dateKey] = record.studyHours || 0;
      });
      setHeatmapIntensity(intensityMap);
    }
  }, [history]);

  const renderConsistencyHeatmap = () => {
    const viewDate = new Date(selectedStatsDate);
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthLabel = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    const changeMonth = (delta) => {
      const d = new Date(selectedStatsDate);
      d.setMonth(d.getMonth() + delta);
      setSelectedStatsDate(d);
    };

    const days = [];
    // Padding for First Week
    for (let i = 0; i < firstDay; i++) days.push(null);
    // Month Days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const hours = heatmapIntensity[dateStr] || 0;
      let level = 0;
      if (hours > 0) level = 1;
      if (hours > 3) level = 2;
      if (hours > 6) level = 3;
      if (hours > 9) level = 4;
      days.push({ date: dateStr, level, hours, day: i });
    }

    return (
      <div className="flex flex-col gap-6 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Calendar size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Focus Rhythm</p>
              <h4 className="text-sm font-black text-white uppercase tracking-tight italic">{monthLabel}</h4>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
              <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-all"><ChevronLeft size={16} /></button>
              <button onClick={() => setSelectedStatsDate(new Date())} className="px-3 text-[9px] font-black uppercase text-blue-500">Today</button>
              <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-all"><ChevronRight size={16} /></button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 ml-2 border-l border-white/10 pl-4">
              {[0, 1, 2, 3, 4].map(l => (
                <div key={l} className={cn(
                  "w-3 h-3 rounded-sm",
                  l === 0 ? "bg-white/[0.03] border border-white/5" :
                    l === 1 ? "bg-emerald-500/20" :
                      l === 2 ? "bg-emerald-500/40" :
                        l === 3 ? "bg-emerald-500/70" : "bg-emerald-500"
                )} />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-black/20 rounded-[2rem] p-4 sm:p-6 border border-white/5">
          <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={`${d}-${i}`} className="text-center text-[9px] font-black text-zinc-600 uppercase tracking-widest">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {days.map((day, idx) => (
              day ? (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  key={idx}
                  title={`${day.date}: ${day.hours.toFixed(1)}h`}
                  className={cn(
                    "aspect-square rounded-lg transition-all cursor-help flex items-center justify-center relative group",
                    day.level === 0 ? "bg-white/[0.03] border border-white/5" :
                      day.level === 1 ? "bg-emerald-500/20" :
                        day.level === 2 ? "bg-emerald-500/40" :
                          day.level === 3 ? "bg-emerald-500/70 shadow-[0_4px_10px_rgba(16,185,129,0.1)]" : "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  )}
                >
                  <span className={cn(
                    "text-[10px] sm:text-xs font-black italic opacity-0 group-hover:opacity-100 transition-opacity",
                    day.level > 2 ? "text-white" : "text-gray-500"
                  )}>{day.day}</span>
                  {day.level > 0 && (
                    <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-white/20" />
                  )}
                </motion.div>
              ) : (
                <div key={idx} className="aspect-square" />
              )
            ))}
          </div>
        </div>

        <div className="sm:hidden flex items-center justify-end gap-1.5 px-2">
          <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mr-2">Intensity Score</span>
          {[0, 1, 2, 3, 4].map(l => (
            <div key={l} className={cn(
              "w-3 h-3 rounded-sm",
              l === 0 ? "bg-white/[0.03] border border-white/5" :
                l === 1 ? "bg-emerald-500/20" :
                  l === 2 ? "bg-emerald-500/40" :
                    l === 3 ? "bg-emerald-500/70" : "bg-emerald-500"
            )} />
          ))}
        </div>
      </div>
    );
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
        localStorage.removeItem('sessionId');
        navigate('/login');
        toast.success("Security session terminated.");
      } catch (err) {
        // Fallback for network issues
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('sessionId');
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
          <div className="grid grid-cols-1 gap-8">
            <div className="w-full">
              <Skeleton className="h-[500px] w-full rounded-[3rem]" />
              <Skeleton className="h-20 w-full rounded-[2.5rem]" />
            </div>
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
          Log Out
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
              {profileFormData.fullName || user?.name || 'Student Profile'}
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

          {/* Section: Connected Devices */}
          <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-6 sm:p-8 space-y-6 shadow-xl group/card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover/card:bg-emerald-500/20 transition-all">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Connected Devices</h3>
                <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Active sessions across all platforms</p>
              </div>
            </div>

            <div className="space-y-4">
              <ActiveSessions />
              <div className="p-4 bg-zinc-950/50 rounded-2xl border border-white/5">
                <div className="flex gap-3">
                  <ShieldCheck className="text-zinc-600 shrink-0" size={14} />
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                    If you see a device you do not recognize, log it out and contact support.
                  </p>
                </div>
              </div>
            </div>
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
              {otpRequestPending ? 'Sending code...' : 'Save Profile Changes'}
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-6 bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-white/5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <Power size={14} strokeWidth={3} />
              Log Out
            </button>
          </div>
        </div>

      </div>
    );
  };

  // --- VIEW RENDERING FUNCTIONS ---

  const renderStudyHub = () => (
    <div className="flex flex-col h-full space-y-6">
      <div className="glass-card rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-12 border border-white/5 shadow-2xl relative overflow-hidden group flex flex-col items-center">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 w-full flex flex-col items-center">
          {/* Header */}
          <div className="w-full flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Timer size={20} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-black text-white italic tracking-tighter uppercase leading-none">Focus Timer</h2>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleResetTimer}
              className="p-3 rounded-xl bg-white/5 text-gray-500 hover:text-white transition-all border border-white/5"
            >
              <RotateCcw size={16} />
            </motion.button>
          </div>

          {/* Large Center Timer */}
          <div className="relative mb-12 group/timer">
            <motion.div
              initial={false}
              animate={{ scale: pomodoro.isRunning ? 1.05 : 1 }}
              className="text-6xl sm:text-9xl font-black text-white tracking-tighter tabular-nums italic leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
              {formatTimer(pomodoro.timeLeft)}
            </motion.div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${pomodoro.isRunning ? 'bg-indigo-500 animate-pulse' : 'bg-gray-600'}`} />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">{pomodoro.isRunning ? 'Active' : 'Idle'}</span>
              </div>

              {pomodoro.isRunning && "Notification" in window && Notification.permission === "granted" && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full"
                >
                  <ShieldCheck size={8} />
                  Notifications On
                </motion.div>
              )}
            </div>
          </div>

          {/* Primary Action Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleTimer}
            className={`w-full py-3 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-2xl mb-8 ${pomodoro.isRunning
              ? 'bg-white/5 text-white border border-white/10'
              : 'bg-indigo-600 text-white shadow-indigo-500/30'
              }`}
          >
            {pomodoro.isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            <span>{pomodoro.isRunning ? 'Pause' : 'Start'}</span>
          </motion.button>

          {/* Time Management UI */}
          <div className="w-full">
            {!isCustomPomodoro ? (
              <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                {['25', '50'].map((mins) => (
                  <motion.button
                    key={mins}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      dispatch(updatePomodoro({ timeLeft: parseInt(mins) * 60, isRunning: false }));
                      setCustomPomodoroMins(mins);
                    }}
                    className={`flex-1 py-2 rounded-xl text-[12px] font-black uppercase transition-all ${pomodoro.timeLeft / 60 === parseInt(mins) ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {mins}m
                  </motion.button>
                ))}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCustomPomodoro(true)}
                  className="flex-1 py-2 rounded-xl text-[12px] font-black uppercase text-gray-500 hover:text-white transition-all hover:bg-white/5"
                >
                  Custom
                </motion.button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center w-full gap-2 bg-indigo-500/10 p-2 rounded-2xl border border-indigo-500/20"
              >
                <div className="flex-1 flex items-center px-4">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mr-2">Mins:</span>
                  <input
                    type="number"
                    value={customPomodoroMins}
                    onChange={(e) => setCustomPomodoroMins(e.target.value)}
                    className="bg-transparent border-none text-sm font-black text-white w-full outline-none"
                    autoFocus
                  />
                </div>
                <div className="flex gap-1">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const mins = parseInt(customPomodoroMins);
                      if (mins > 0) {
                        dispatch(updatePomodoro({ timeLeft: mins * 60, isRunning: false }));
                        setIsCustomPomodoro(false);
                      }
                    }}
                    className="h-10 px-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Set
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsCustomPomodoro(false)}
                    className="h-10 w-10 flex items-center justify-center bg-white/10 text-gray-400 rounded-xl"
                  >
                    <RotateCcw size={14} className="rotate-45" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDailyTasks = () => (
    <div className="glass-card rounded-[2rem] sm:rounded-[3rem] p-3 pt-6 sm:p-8 border border-white/5 shadow-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl sm:rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><CheckSquare size={18} className="sm:w-5 sm:h-5" /></div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight italic">Daily Tasks</h2>
            <div className="flex gap-2 mt-1">
              <button onClick={() => handleToggleTaskView('today')} className={`text-[9px] font-black uppercase tracking-widest ${taskView === 'today' ? 'text-indigo-500' : 'text-gray-600'}`}>Today</button>
              <button onClick={() => handleToggleTaskView('archived')} className={`text-[9px] font-black uppercase tracking-widest ${taskView === 'archived' ? 'text-orange-500' : 'text-gray-600'}`}>History</button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          {taskView === 'today' && (
            <button
              onClick={handleSyncRoutine}
              disabled={actionLoading || !isInLibrary}
              className={`p-2 rounded-xl bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 transition-all ${actionLoading || !isInLibrary ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={isInLibrary ? "Sync routine" : "Check in to sync routine"}
            >
              <RefreshCcw size={14} className={actionLoading ? 'animate-spin' : ''} />
            </button>
          )}
          <span className="text-[9px] font-black text-gray-600 uppercase">
            {tasks.filter(t => t.isCompleted).length}/{tasks.length}
          </span>
        </div>
      </div>

      <div className="relative flex-1 flex flex-col min-h-0">
        {!isInLibrary && taskView === 'today' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0B0D17]/60 backdrop-blur-[2px] rounded-[2rem] text-center p-6 border border-white/5">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4">
              <Camera size={32} className="animate-pulse" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-tighter mb-1">Check-in Required</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">Scan the library QR code<br />to unlock today's tasks.</p>
          </div>
        )}

        <div className={`space-y-3 mb-10 flex-1 overflow-y-auto custom-scrollbar`}>

          {tasks.length === 0 && (
            <div className="text-center py-8 opacity-20">
              <CheckSquare size={40} className="mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest">No tasks</p>
            </div>
          )}
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`flex flex-col gap-3 p-2 rounded-2xl bg-white/[0.02] border group transition-all ${task.priority === 'high' ? 'border-orange-500/20' : 'border-white/5'}`}>
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
                            {actionLoading ? 'Saving...' : 'Save'}
                          </button>
                          <button onClick={() => setEditingTask(null)} disabled={actionLoading} className="bg-white/10 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className={`text-sm font-bold block transition-all ${task.isCompleted ? 'text-gray-600 line-through' : 'text-gray-300'}`}>{task.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[12px] text-gray-500 font-bold uppercase tracking-widest">{formatDuration(task.estimatedMinutes)}</span>
                          <div className={`w-1 h-1 rounded-full ${task.priority === 'high' ? 'bg-orange-500' : task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-600'}`} />
                        </div>
                      </>
                    )}
                  </div>
                  {!editingTask && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-all border border-blue-500/10"
                      >
                        <PenLine size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all border border-red-500/10"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Task Timer Integration */}
                {!task.isCompleted && taskView === 'today' && !editingTask && (
                  <div className={`mt-2 p-2 rounded-xl flex items-center justify-between transition-all ${activeTaskTimer?.id === task.id ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-black/20'}`}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleStartTaskTimer(task)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeTaskTimer?.id === task.id && activeTaskTimer.isRunning ? 'bg-orange-500 text-white' : 'bg-indigo-600 text-white'}`}>
                        {activeTaskTimer?.id === task.id && activeTaskTimer.isRunning ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                      </button>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Timer</span>
                        <span className={`text-[15px] font-mono font-bold ${activeTaskTimer?.id === task.id && activeTaskTimer.isRunning ? 'text-orange-500' : 'text-gray-400'}`}>
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
              placeholder={isInLibrary ? "Add today's task..." : "Check in to add today's tasks..."}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              disabled={!isInLibrary}
              className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-12 text-sm font-bold text-white outline-none focus:border-indigo-500/50 transition-all shadow-inner ${!isInLibrary ? 'cursor-not-allowed opacity-50' : ''}`}
            />
            <div className={`flex flex-col gap-3 ${!isInLibrary ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex gap-2">
                <div className="flex bg-white/5 rounded-xl border border-white/10 p-1.5 flex-1">
                  <input type="number" placeholder="Hrs" value={newTaskHrs} onChange={(e) => setNewTaskHrs(e.target.value)} className="w-16 bg-transparent text-[12px] font-bold text-white outline-none px-2 text-center" />
                  <div className="w-[1px] bg-white/10 h-5 self-center" />
                  <input type="number" placeholder="Min" value={newTaskMin} onChange={(e) => setNewTaskMin(e.target.value)} className="w-16 bg-transparent text-[12px] font-bold text-white outline-none px-2 text-center" />
                </div>
                <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-gray-500 outline-none flex-1 min-w-[120px]">
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={actionLoading || !isInLibrary}
                className={`w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 ${actionLoading || !isInLibrary ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
                <span>{actionLoading ? 'Processing...' : 'Add Task'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  const renderFeeStatusCard = () => {
    if (!feeStatus) return null;

    const { summary, history } = feeStatus;
    const currentCycle = history?.[0]; // Latest cycle

    return (
      <div className="glass-card p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] bg-indigo-500/5 border border-indigo-500/10 relative overflow-hidden group shadow-2xl">
        <div className="flex flex-col items-center justify-between relative z-10 flex-wrap gap-6 sm:flex-row sm:items-start">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className={cn(
              "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[2rem] flex items-center justify-center border shadow-xl transition-transform group-hover:scale-110",
              currentCycle?.isOverdue ? "bg-rose-500/20 border-rose-500/30 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
            )}>
              <CreditCard size={28} className="sm:w-8 sm:h-8" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] sm:tracking-[0.4em] mb-1 leading-none">Subscription</p>
              <h3 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
                {currentCycle?.isOverdue ? 'Balance Due' : 'Active Access'}
              </h3>
            </div>
          </div>
          <div className="flex-1 sm:flex-none text-right flex flex-col items-end gap-2">
            <span className={cn(
              "px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border",
              currentCycle?.isOverdue ? "bg-rose-500 text-white border-rose-500/30 animate-pulse" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            )}>
              {currentCycle?.status}
            </span>
          </div>
        </div>

        {currentCycle?.isOverdue && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 sm:mt-8 p-5 sm:p-6 rounded-2xl sm:rounded-[2.5rem] bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-500/20 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7 text-rose-500" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs font-black text-white uppercase tracking-widest">Fee Balance Pending</p>
              <p className="text-[11px] sm:text-xs text-rose-300 font-bold leading-relaxed mt-1.5 tracking-wide">
                Monthly cycle completed on <span className="text-white font-black underline decoration-rose-500/50 underline-offset-4">{new Date(currentCycle.cycleDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>.
                Pending: <span className="text-white font-black text-base ml-1">₹{currentCycle.balance}</span>.
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Total Paid</span>
            <span className="text-base sm:text-lg font-black text-white flex items-center gap-1">
              <IndianRupee size={12} strokeWidth={3} /> {summary?.totalPaid}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Total Due</span>
            <span className={cn("text-base sm:text-lg font-black flex items-center gap-1", summary?.totalPending > 0 ? "text-rose-500" : "text-emerald-500")}>
              <IndianRupee size={12} strokeWidth={3} /> {summary?.totalPending}
            </span>
          </div>
        </div>

        <button
          onClick={() => setActiveModal('ledger')}
          className="mt-6 w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center justify-center gap-3 transition-all group/btn"
        >
          <Receipt size={16} className="text-indigo-400 group-hover/btn:scale-110 transition-transform" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">View Detailed Ledger</span>
          <ChevronRight size={14} className="text-gray-500 group-hover/btn:translate-x-1 transition-transform" />
        </button>

        <div className="absolute -right-4 -bottom-4 text-indigo-500/5 group-hover:scale-125 transition-transform rotate-12">
          <IndianRupee size={100} />
        </div>
      </div>
    );
  };

  const renderFeeLedgerModal = () => {
    if (activeModal !== 'ledger') return null;
    const history = feeStatus?.history || [];
    const payments = feeStatus?.payments || [];

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setActiveModal(null)}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0d1117] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <History size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-tighter italic">Financial Ledger</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Transparent billing & history</p>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-8 pt-6 gap-6 border-b border-white/5 shrink-0 bg-white/[0.01]">
            <button
              onClick={() => setLedgerTab('cycles')}
              className={cn(
                "pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative",
                ledgerTab === 'cycles' ? "text-indigo-400" : "text-gray-500 hover:text-gray-300"
              )}
            >
              Billing Ledger
              {ledgerTab === 'cycles' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
            </button>
            <button
              onClick={() => setLedgerTab('journal')}
              className={cn(
                "pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative",
                ledgerTab === 'journal' ? "text-indigo-400" : "text-gray-500 hover:text-gray-300"
              )}
            >
              Payment Journal
              {ledgerTab === 'journal' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
            {ledgerTab === 'cycles' ? (
              <div className="space-y-4">
                {history.map((cycle, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={`${cycle.month}-${cycle.year}`}
                    className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px]",
                        cycle.status === 'PAID' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      )}>
                        {new Date(cycle.year, cycle.month - 1).toLocaleString('default', { month: 'short' }).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">{new Date(cycle.year, cycle.month - 1).toLocaleString('default', { month: 'long' })} {cycle.year}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1 opacity-60">
                          Due: ₹{cycle.expected} | Paid: ₹{cycle.paid}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border",
                        cycle.isCredit ? "bg-indigo-500/10 text-indigo-400 border-indigo-400/20" :
                          cycle.status === 'PAID' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      )}>
                        {cycle.isCredit ? "PAID (Credit)" : cycle.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {payments.length > 0 ? (
                  payments.map((p, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={p.id}
                      className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                          <Receipt size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">₹{p.amount} Received</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase opacity-60">
                            {new Date(p.paymentDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Target Cycle</span>
                        <span className="text-[10px] font-black text-indigo-400">
                          {new Date(p.year, p.month - 1).toLocaleString('default', { month: 'short' })} {p.year}
                        </span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <Receipt size={40} className="text-gray-700 mx-auto mb-4 opacity-20" />
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No transaction records found</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 bg-indigo-500/5 text-center shrink-0">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">All amounts in Indian Rupee (INR)</p>
          </div>
        </motion.div>
      </div>
    );
  };

  const formatHistoryTime = (hours) => {
    const totalMinutes = Math.round((hours || 0) * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m}MIN`;
    return `${h}HRS ${m}MIN`;
  };

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
              {todayStatus?.status || 'Waiting for update'}
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
          </div>

          <div className="glass-card p-8 rounded-[3rem] bg-gradient-to-br from-blue-600/5 to-transparent border border-white/5 relative overflow-hidden shadow-2xl">
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 relative mb-8">
                <ResponsiveContainer width="99%" height={150} minHeight={150}>
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
                    <span className="text-2xl font-black text-blue-500 tracking-tighter">{formatStudyTime(todayStatus?.studyHours || 0)}</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-500">
                    <Clock size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Analytics */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          <div className="grid grid-cols-1 gap-8">
            <div className="w-full">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-4 sm:mt-8">
            <div className="glass-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 border border-white/5 shadow-2xl">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500"><TrendingUp size={20} /></div>
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight italic">Today's Progress</h2>
              </div>
              <div className="h-[200px] sm:h-[250px] min-h-[200px] sm:min-h-[250px]">
                <ResponsiveContainer width="99%" height={250} minHeight={200} debounce={100}>
                  <BarChart data={getProcessedChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey={chartRange === 'year' ? 'label' : 'date'} axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 10, fontWeight: '800' }} tickFormatter={getRangeLabel} />
                    <YAxis hide domain={[0, 'auto']} />
                    <ReTooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#0c0c0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '10px' }} />
                    <Bar dataKey="studyHours" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 border border-white/5 shadow-2xl">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><LayoutGrid size={20} /></div>
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight italic">Subjects</h2>
              </div>
              <div className="h-[200px] sm:h-[250px] min-h-[200px] sm:min-h-[250px]">
                {subjectAnalytics.length > 0 ? (
                  <ResponsiveContainer width="99%" height={250} minHeight={200} debounce={100}>
                    <PieChart>
                      <Pie data={subjectAnalytics} dataKey="hours" nameKey="subject" cx="50%" cy="50%" innerRadius={50} outerRadius={70} fill="#8884d8" paddingAngle={5}>
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

  const renderTasksView = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-10 pb-32 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Daily <span className="text-blue-500">Study Plan</span></h2>
        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Your timer, routine, and tasks for today</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          {renderStudyHub()}
        </div>
        <div className="space-y-8">
          {renderDailyTasks()}
        </div>
      </div>
    </motion.div>
  );

  const renderRoutineBuilder = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-8 sm:space-y-12 pb-32 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4 sm:mb-12">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter uppercase leading-tight">Weekly <span className="text-indigo-500">Schedule</span></h2>
          <p className="text-zinc-500 text-xs sm:text-sm mt-3 font-medium">Design your recurring study sessions per day.</p>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-3 pb-4 custom-scrollbar no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, idx) => (
          <button key={day} onClick={() => setRoutineDay(idx)} className={`min-w-[75px] sm:min-w-[90px] p-4 rounded-2xl border transition-all flex flex-col items-center gap-1.5 ${routineDay === idx ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 border-white/10 text-gray-500'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{day}</span>
            <span className="text-[10px] font-black italic">{weeklyRoutine.filter(r => r.dayOfWeek === idx).length}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
        <div className="space-y-6 sm:space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><PenLine size={18} /></div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Add Subject</h3>
          </div>

          <form onSubmit={handleAddScheduleItem} className="glass-card p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] bg-white/[0.03] border border-white/5 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Subject</label>
              <input type="text" placeholder="e.g., Mathematics" value={newRoutineSubject} onChange={(e) => setNewRoutineSubject(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-semibold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-white/25" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Hours</label>
                <input type="number" placeholder="2" value={newRoutineHrs} onChange={(e) => setNewRoutineHrs(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-semibold text-white outline-none placeholder:text-white/25" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Minutes</label>
                <input type="number" placeholder="30" value={newRoutineMin} onChange={(e) => setNewRoutineMin(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-semibold text-white outline-none placeholder:text-white/25" />
              </div>
            </div>

            <button type="submit" disabled={actionLoading} className={`w-full py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl sm:rounded-[2rem] shadow-xl hover:bg-indigo-500 transition-all active:scale-95 flex items-center justify-center gap-3 ${actionLoading ? 'opacity-50 pointer-events-none' : ''}`}>
              {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
              Add Subject
            </button>
          </form>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><LayoutGrid size={18} /></div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Today's Schedule</h3>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
            {weeklyRoutine.filter(r => r.dayOfWeek === routineDay).length === 0 ? (
              <div className="text-center py-16 sm:py-20 opacity-20 bg-white/[0.01] rounded-[2rem] sm:rounded-[3rem] border border-dashed border-white/10">
                <Calendar size={40} className="mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">No subjects</p>
              </div>
            ) : (
              weeklyRoutine.filter(r => r.dayOfWeek === routineDay).map(node => (
                <div key={node.id} className="p-5 sm:p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center justify-between group">
                  <div>
                    <span className="text-base sm:text-lg font-bold text-white block leading-none">{node.subject}</span>
                    <span className="text-[12px] font-black text-gray-500 uppercase tracking-widest mt-2 block">{formatDuration(node.estimatedMinutes)}</span>
                  </div>
                  <button onClick={() => handleRemoveScheduleItem(node.id)} className="p-3 text-red-500 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
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
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Study <span className="text-blue-500">Log</span></h2>
        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Write what you studied today</p>
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
            {actionLoading ? 'Saving...' : 'Save Entry'}
          </button>
        </form>
      </div>
    </motion.div>
  );
  const renderHistory = () => {
    const analyticsData = getAggregatedAnalytics();
    const totalHours = analyticsData.reduce((acc, curr) => acc + curr.hours, 0);
    const avgHours = analyticsData.length > 0 ? (totalHours / analyticsData.length).toFixed(1) : '0';

    // Period Label for Chart
    let periodLabel = '';
    if (analyticsRange === '7D') periodLabel = 'Current Week';
    if (analyticsRange === '30D') periodLabel = 'Calendar Month';
    if (analyticsRange === '90D') periodLabel = 'Quarterly Overview';
    if (analyticsRange === '1Y') periodLabel = `Annual Performance (${selectedStatsDate.getFullYear()})`;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="space-y-6 sm:space-y-10 pb-32 max-w-5xl mx-auto"
      >
          {/* History Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-1">
          <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                Study <span className="text-blue-500">Insights</span>
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] italic">Showing data for {selectedStatsDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
              </div>
          </div>

          <div className="flex gap-1 bg-white/5 border border-white/5 p-1 rounded-2xl self-start sm:self-auto">
            {['7D', '30D', '90D', '1Y'].map(range => (
              <button
                key={range}
                onClick={() => setAnalyticsRange(range)}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all",
                  analyticsRange === range ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-white"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Intelligence Grid - Mobile optimized 2x2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 px-1">
          {[
            { label: 'Total Time', value: `${totalHours.toFixed(1)}H`, sub: 'All Study Hours', color: 'indigo' },
            { label: 'Average', value: `${avgHours}H`, sub: 'Per Day', color: 'blue' },
            { label: 'Best Day', value: `${([...analyticsData].sort((a, b) => b.hours - a.hours)[0]?.hours || 0).toFixed(1)}H`, sub: 'Highest Hours', color: 'emerald' },
            { label: 'Streak', value: `${metrics?.currentStreak || 0}D`, sub: 'Days in a Row', color: 'orange' }
          ].map((card, i) => (
            <div key={i} className={cn(
              "p-4 sm:p-5 rounded-[2rem] border transition-all hover:scale-[1.02]",
              card.color === 'indigo' ? "bg-indigo-500/5 border-indigo-500/10" :
                card.color === 'blue' ? "bg-blue-500/5 border-blue-500/10" :
                  card.color === 'emerald' ? "bg-emerald-500/5 border-emerald-500/10" :
                    "bg-orange-500/5 border-orange-500/10"
            )}>
              <span className={cn("text-[9px] font-black uppercase tracking-widest block mb-2 opacity-60", `text-${card.color}-400`)}>{card.label}</span>
              <span className="text-xl sm:text-2xl font-black text-white italic tracking-tighter">{card.value}</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase block mt-1">{card.sub}</span>
            </div>
          ))}
        </div>

        {/* Consistency Calendar - Now month-wise */}
        <div className="glass-card rounded-[2.5rem] sm:rounded-[3rem] p-4 sm:p-8 bg-zinc-900/40 border border-white/5 shadow-2xl overflow-hidden">
          {renderConsistencyHeatmap()}
        </div>

        {/* Velocity Graph - Calendar Aligned */}
        <div className="glass-card rounded-[2.5rem] sm:rounded-[3rem] p-4 sm:p-8 bg-zinc-900/40 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <TrendingUp size={120} />
          </div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400"><TrendingUp size={20} /></div>
              <div>
                <h3 className="text-sm sm:text-lg font-black text-white uppercase tracking-tight italic">Study Time Trend</h3>
                <p className="text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase tracking-widest">{periodLabel}</p>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar pb-4">
            <div className={cn(
              "h-[220px] sm:h-[300px] transition-all duration-500",
              analyticsRange === '7D' ? "w-full" :
                analyticsRange === '30D' ? "w-[150%] sm:w-full min-w-[600px]" :
                  "w-[300%] sm:w-full min-w-[1000px]"
            )}>
              <ResponsiveContainer width="100%" height={220} minHeight={220}>
                <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4B5563', fontSize: 8, fontWeight: '900' }}
                    interval={0}
                  />
                  <YAxis hide domain={[0, 'auto']} />
                  <ReTooltip
                    cursor={{ stroke: '#3B82F6', strokeWidth: 2, strokeDasharray: '5 5' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#0c0c0e] border border-white/10 p-2 sm:p-3 rounded-2xl shadow-2xl">
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">{payload[0].payload.fullDate}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-lg sm:text-xl font-black text-white italic tracking-tighter">{formatStudyTime(payload[0].value)}</span>
                              <span className="text-[8px] font-black text-blue-500 uppercase">Study</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="space-y-6 px-1">
          <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-6 flex items-center gap-3">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
            Subject <span className="text-indigo-500">Breakdown</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {subjectAnalytics.length > 0 ? subjectAnalytics.map((item, idx) => (
              <motion.div
                whileHover={{ y: -5 }}
                key={item.subject}
                className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <LayoutGrid size={18} />
                  </div>
                  <div className="text-right">
                    <span className="text-[12px] font-black text-white italic">{formatStudyTime(item.hours)}</span>
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-tighter mt-0.5">Logged</p>
                  </div>
                </div>
                <h4 className="text-base font-black text-white italic leading-tight mb-3 truncate">{item.subject}</h4>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (item.hours / Math.max(1, totalHours)) * 100)}%` }}
                    className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  />
                </div>
                <div className="flex items-center justify-between mt-2.5 text-[8px] font-black text-gray-500 uppercase tracking-widest">
                  <span>Intensity</span>
                  <span>{((item.hours / Math.max(1, totalHours)) * 100).toFixed(1)}%</span>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full py-16 text-center opacity-20 bg-white/[0.01] rounded-[3rem] border border-dashed border-white/10">
                <Activity size={32} className="mx-auto mb-3" />
                <p className="text-[9px] font-black uppercase tracking-[0.2em]">No subject data available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Node Explorer (Daily View) */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-tight flex items-center gap-3">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              Daily <span className="text-emerald-500">Summary</span>
            </h3>
            <div className="relative">
              <input
                type="date"
                value={selectedHistoryDate ? selectedHistoryDate.split('T')[0] : ''}
                onChange={(e) => handleSelectHistoryDate(e.target.value)}
                className="bg-zinc-800 border-none rounded-xl px-3 py-1.5 text-[9px] font-black text-white uppercase outline-none focus:ring-1 ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 px-1">
            {selectedHistoryDate ? (
              <>
                <div className="p-8 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/10 relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-[80px] rounded-full" />
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">
                      {selectedNodeIsLive ? 'Live Library Time' : 'Total Library Time'}
                    </span>
                    {selectedNodeIsLive && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em]">Live</span>}
                  </div>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-5xl font-black text-white italic tracking-tighter">
                      {formatLibraryDuration(selectedLibraryMinutes)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      {selectedLibraryStatus}
                    </div>
                    <div className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      {selectedNodeIsLive ? `Checked in at ${formatTime(todayStatus?.checkIn || todayStatus?.checkInTime)}` : 'Saved in your account history'}
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 rounded-[3rem] bg-zinc-900 border border-white/5 space-y-6">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckSquare size={14} className="text-blue-500" /> Session Tasks
                    </div>
                    {historyTasksLoading && (
                      <div className="flex items-center gap-2 text-emerald-500/50">
                        <Loader2 size={10} className="animate-spin" />
                        <span className="text-[8px] animate-pulse">Loading tasks...</span>
                      </div>
                    )}
                  </h4>
                  <div className="space-y-2">
                    {historyTasks.length > 0 ? historyTasks.map(task => {
                      const durationStr = task.estimatedMinutes ? `${task.estimatedMinutes}m` : 'No Limit';
                      const timeStr = task.completedAt
                        ? new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                        : new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                      return (
                        <div key={task.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
                          <div className="flex flex-col truncate pr-4">
                            <span className={`text-[12px] font-black italic truncate ${task.isCompleted ? 'text-white' : 'text-zinc-600'}`}>{task.title}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">
                                {task.estimatedMinutes ? formatStudyTime(task.estimatedMinutes / 60) : 'No time limit'}
                              </span>
                              <span className="text-[7px] font-bold text-gray-600 uppercase tracking-widest">• {timeStr}</span>
                            </div>
                          </div>
                          <span className={cn(
                            "text-[9px] font-black px-2 py-0.5 rounded-lg uppercase shrink-0 transition-all",
                            task.isCompleted ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                          )}>{task.isCompleted ? 'Done' : 'Pending'}</span>
                        </div>
                      );
                    }) : !historyTasksLoading ? (
                      <p className="text-[9px] text-zinc-700 font-bold italic py-8 text-center uppercase tracking-widest opacity-40">No tasks found for this date</p>
                    ) : (
                      <div className="space-y-2 py-4">
                        {[1, 2].map(i => (
                          <div key={i} className="h-14 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="col-span-full py-16 bg-white/[0.01] rounded-[3rem] border border-dashed border-white/5 flex flex-col items-center justify-center gap-4 text-zinc-800">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center">
                  <History size={32} />
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em]">Select a date to view your study history</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <GraduationCap size={22} />
            </div>
            <span className="text-xl font-black text-white tracking-tighter uppercase italic">Student<span className="text-blue-500">Dashboard</span></span>
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

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-32 sm:pb-20">
        <AnimatePresence mode="wait">
          {isRestricted ? (
            <motion.div key="restricted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              {renderRestrictedAccess()}
            </motion.div>
          ) : loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {activeView === 'hub' && <HubSkeleton />}
              {activeView === 'tasks' && <HubSkeleton />}
              {activeView === 'routine' && <RoutineSkeleton />}
              {activeView === 'history' && <HistorySkeleton />}
            </motion.div>
          ) : (
            <>
              {activeView === 'hub' && renderHub()}
              {activeView === 'tasks' && renderTasksView()}
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
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-6 left-4 right-4 z-[1000] flex justify-center"
          >
            <motion.div
              className="w-full max-w-sm bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex items-center gap-4 relative overflow-hidden ring-1 ring-white/20 active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-600/20">
                <Timer size={24} className="animate-bounce" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Timer Alert</span>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Just Now</span>
                </div>
                <h3 className="text-sm font-black text-white truncate">Session Terminated</h3>
                <p className="text-[11px] text-zinc-400 font-medium truncate">Timer goal reached. Awaiting deactivation.</p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={stopAlarm}
                  className="w-10 h-10 bg-white/5 text-zinc-400 rounded-xl flex items-center justify-center hover:bg-white/10 hover:text-white transition-all border border-white/5"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={stopAlarm}
                  className="px-4 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center"
                >
                  Stop
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HOTSTAR STYLE NAVIGATION BAR --- */}
      {!isRestricted && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md px-2 sm:px-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-4">
          <div className="bg-[#0B0D17]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-1.5 sm:p-2 flex items-center justify-between shadow-[0_25px_50px_-12px_rgba(59,130,246,0.3)]">
            <button onClick={() => setActiveView('hub')} className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${activeView === 'hub' ? 'text-blue-500 scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
              <LayoutGrid size={24} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-center w-full">Home</span>
            </button>

            <button onClick={() => setActiveView('tasks')} className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${activeView === 'tasks' ? 'text-blue-500 scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
              <Zap size={24} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-center w-full">Tasks</span>
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
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-center w-full">History</span>
            </button>
          </div>
        </div>
      )}

      {/* --- OVERLAYS --- */}
      <AnimatePresence>
        {activeModal === 'qr' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModal(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-zinc-900 border border-white/10 p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter italic">Scan Library QR</h3>
                <button onClick={() => setActiveModal(null)} className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-white"><XCircle size={20} /></button>
              </div>
              <div className="bg-black/50 rounded-2xl sm:rounded-[2rem] mb-6 overflow-hidden border border-white/5 h-[280px] sm:h-[300px] relative">
                <Scanner onScan={handleScanSuccess} components={{ audio: false, finder: true }} styles={{ container: { width: '100%', height: '100%' } }} />
              </div>
              <button onClick={() => setActiveModal(null)} className="w-full py-4 rounded-xl sm:rounded-2xl bg-white/5 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:bg-white/10">Close Scanner</button>
            </motion.div>
          </div>
        )}

        {activeModal === 'goal' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModal(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-zinc-900 border border-white/10 p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] w-full max-w-sm overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter">Daily Target</h3>
                <button onClick={() => setActiveModal(null)} className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-white"><XCircle size={20} /></button>
              </div>
              <div className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-4 gap-2">
                  {[6, 8, 10, 12].map(hrs => (
                    <button key={hrs} onClick={() => setTempGoal(hrs)} className={`py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black border transition-all ${Number(tempGoal) === hrs ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 border-white/5 text-gray-500'}`}>{hrs}H</button>
                  ))}
                </div>
                <input type="number" value={tempGoal} onChange={(e) => setTempGoal(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-2xl sm:text-4xl font-black text-center text-white focus:border-blue-500 outline-none" />
                <div className="flex gap-3">
                  <button onClick={() => setActiveModal(null)} className="flex-1 py-4 sm:py-5 bg-white/5 text-zinc-500 font-bold rounded-xl sm:rounded-2xl text-xs uppercase">Abort</button>
                  <button onClick={handleUpdateGoal} disabled={actionLoading} className={`flex-2 px-6 sm:px-8 py-4 sm:py-5 bg-blue-600 text-white font-black rounded-xl sm:rounded-2xl shadow-xl shadow-blue-500/20 text-xs uppercase tracking-widest ${actionLoading ? 'opacity-50' : ''}`}>
                    {actionLoading ? 'Saving...' : 'Save Goal'}
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
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Confirm Profile Update</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-10 leading-loose">
                Enter the 6-digit code sent to {user?.email}<br />to save your profile changes
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
                  {actionLoading ? 'Saving...' : 'Verify & Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {renderFeeLedgerModal()}
    </div>
  );
}
