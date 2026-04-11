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
  RefreshCcw
} from 'lucide-react';
import { logoutAdmin } from '../store/slices/authSlice';
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
  savePomodoroSettings
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

  const [activeView, setActiveView] = React.useState('hub'); // 'hub' | 'rank' | 'journal' | 'history' | 'routine'
  const [activeModal, setActiveModal] = React.useState(null); // 'qr' | 'goal'
  const [chartRange, setChartRange] = React.useState('week'); // 'week' | 'month' | 'year'
  const [tempGoal, setTempGoal] = React.useState(metrics?.dailyGoalHours || 8);
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
      handleTimerComplete(`Task: ${tasks.find(t => t.id === activeTaskTimer.id)?.title || 'Task'}`);
      // Auto-complete the task
      handleToggleTask(activeTaskTimer.id, false);
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
    toast.success("Rhythms stabilized.");
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
      toast.success("Rhythm pattern synchronized.");
    } catch (err) {
      toast.error(err || "Rhythm sync failed");
    }
  };

  const handleSelectHistoryDate = (date) => {
    setSelectedHistoryDate(date);
    dispatch(fetchHistoryTasks(date));
  };

  const handleCreateRoutineNode = async (e) => {
    e.preventDefault();
    if (!newRoutineSubject.trim()) return;
    try {
      const estimatedMinutes = (parseInt(newRoutineHrs) || 0) * 60 + (parseInt(newRoutineMin) || 0);
      await dispatch(createRoutineNode({
        dayOfWeek: routineDay,
        subject: newRoutineSubject,
        estimatedMinutes,
        priority: 'medium'
      })).unwrap();
      setNewRoutineSubject('');
      setNewRoutineHrs('');
      setNewRoutineMin('');
      toast.success("Rhythm node designed.");
    } catch (err) {
      toast.error("Design failure");
    }
  };

  const handleDeleteRoutineNode = async (id) => {
    try {
      await dispatch(deleteRoutineNode(id)).unwrap();
      toast.success("Rhythm node purged.");
    } catch (err) {
      toast.error("Purge failure");
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
    if (!window.confirm("Purge this task node?")) return;
    try {
      await dispatch(deleteTask(id)).unwrap();
      if (activeTaskTimer?.id === id) setActiveTaskTimer(null);
      toast.success("Node purged.");
    } catch (err) {
      toast.error("Purge failed");
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
      toast.success("Node updated.");
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
      toast.success("Focus target recalibrated.");
    } catch (err) {
      toast.error("Failed to update goal");
    }
  };

  const handleCreateLog = async (e) => {
    e.preventDefault();
    if (actionLoading) return;
    try {
      await dispatch(createStudyLog(logFormData)).unwrap();
      toast.success("Study node preserved.");
      setLogFormData({
        subject: '',
        topicsCovered: '',
        hoursSpent: todayStatus?.studyHours?.toFixed(1) || 0,
        productivityRating: 5
      });
      setActiveView('journal'); // Stay on journal view to see the new log
    } catch (err) {
      toast.error(err || "Failed to preserve log");
    }
  };

  const handleDeleteLog = async (id) => {
    if (!window.confirm("Purge this study node from history?")) return;
    try {
      await dispatch(deleteStudyLog(id)).unwrap();
      toast.success("Node purged successfully.");
    } catch (err) {
      toast.error(err || "Purge failed");
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
    try {
      await dispatch(logoutAdmin()).unwrap();
      toast.success("Disconnected.");
      navigate('/login');
    } catch (err) {
      toast.error("Disconnection Failed");
    }
  };

  const handleScanSuccess = async (result) => {
    if (!result || !result[0] || !result[0].rawValue) return;
    const qrValue = result[0].rawValue.trim();
    if (!qrValue) return;

    setActiveModal(null);
    try {
      await dispatch(autoMarkAttendance(qrValue)).unwrap();
      toast.success("Attendance Synchronized!");
      dispatch(fetchTodayStatus());
      dispatch(fetchMetrics());
      dispatch(fetchHistory());
    } catch (err) {
      toast.error(err || "Shift Activation Failed");
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

  // --- VIEW RENDERING FUNCTIONS ---

  const renderFocusTerminal = () => (
    <div className="glass-card p-6 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-500/10 shadow-2xl overflow-hidden relative group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${pomodoro.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{pomodoro.mode === 'focus' ? 'Focus Terminal' : 'Recharge Node'}</span>
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
          <button onClick={() => setShowPomodoroSettings(false)} className="w-full py-2 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase rounded-xl hover:bg-indigo-500/20">Save Configuration</button>
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
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Daily Prep</h2>
            <div className="flex gap-2 mt-1">
              <button onClick={() => handleToggleTaskView('today')} className={`text-[8px] font-black uppercase tracking-widest ${taskView === 'today' ? 'text-indigo-500' : 'text-gray-600'}`}>Today</button>
              <button onClick={() => handleToggleTaskView('archived')} className={`text-[8px] font-black uppercase tracking-widest ${taskView === 'archived' ? 'text-orange-500' : 'text-gray-600'}`}>Yesterday's Wins</button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {taskView === 'today' && (
            <button 
              onClick={handleSyncRoutine} 
              disabled={actionLoading}
              className={`p-2 rounded-xl bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 transition-all ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Sync Today's Rhythm"
            >
              <RefreshCcw size={16} className={actionLoading ? 'animate-spin' : ''} />
            </button>
          )}
          <span className="text-[10px] font-black text-gray-600 uppercase">
            {tasks.filter(t => t.isCompleted).length}/{tasks.length} SYNCED
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-6 flex-1 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
        {tasks.length === 0 && (
          <div className="text-center py-8 opacity-20">
            <CheckSquare size={40} className="mx-auto mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest">No {taskView} nodes</p>
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
                       <input type="text" value={editingTask.title} onChange={(e) => setEditingTask({...editingTask, title: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-xs text-white outline-none" placeholder="Task Title" />
                       <div className="flex flex-wrap gap-2">
                          <div className="flex bg-white/10 rounded-lg border border-white/20 p-1 flex-1">
                            <input type="number" value={editingTask.editHrs} onChange={(e) => setEditingTask({...editingTask, editHrs: e.target.value})} className="w-12 bg-transparent text-[10px] font-bold text-white outline-none px-1 text-center" placeholder="H" title="Hours" />
                            <div className="w-[1px] bg-white/20 h-3 self-center" />
                            <input type="number" value={editingTask.editMin} onChange={(e) => setEditingTask({...editingTask, editMin: e.target.value})} className="w-12 bg-transparent text-[10px] font-bold text-white outline-none px-1 text-center" placeholder="M" title="Minutes" />
                          </div>
                          <button onClick={handleUpdateTask} disabled={actionLoading} className={`bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${actionLoading ? 'opacity-50' : ''}`}>
                            {actionLoading ? 'SAVE...' : 'SAVE'}
                          </button>
                          <button onClick={() => setEditingTask(null)} disabled={actionLoading} className="bg-white/10 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">CANCEL</button>
                       </div>
                    </div>
                  ) : (
                    <>
                      <span className={`text-sm font-bold block transition-all ${task.isCompleted ? 'text-gray-600 line-through' : 'text-gray-300'}`}>{task.title}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{formatDuration(task.estimatedMinutes)} node</span>
                        <div className={`w-1 h-1 rounded-full ${task.priority === 'high' ? 'bg-orange-500' : task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-600'}`} />
                      </div>
                    </>
                  )}
                </div>
                {!editingTask && (
                  <div className="flex items-center gap-1">
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
                      <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Active Timer</span>
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
          <input type="text" placeholder="Add preparation goal..." value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-12 text-sm font-bold text-white outline-none focus:border-indigo-500/50 transition-all shadow-inner" />
          <div className="flex flex-wrap gap-2">
            <div className="flex bg-white/5 rounded-xl border border-white/10 p-1 flex-1">
              <input type="number" placeholder="Hrs" value={newTaskHrs} onChange={(e) => setNewTaskHrs(e.target.value)} className="w-14 bg-transparent text-[10px] font-bold text-white outline-none px-2 text-center" />
              <div className="w-[1px] bg-white/10 h-4 self-center" />
              <input type="number" placeholder="Min" value={newTaskMin} onChange={(e) => setNewTaskMin(e.target.value)} className="w-14 bg-transparent text-[10px] font-bold text-white outline-none px-2 text-center" />
            </div>
            <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-[10px] font-bold text-gray-500 outline-none flex-1 min-w-[100px]">
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <button type="submit" disabled={actionLoading} className={`p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-500/10 transition-all active:scale-90 ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <PlusCircle size={20} />}
            </button>
          </div>
        </form>
      )}
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
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Live Terminal Status</span>
              <div className="flex items-center gap-3">
                <span className={`text-lg sm:text-xl font-black ${todayStatus?.status === 'In Library' ? 'text-emerald-400' : 'text-white'}`}>
                  {todayStatus?.status === 'In Library' ? 'ACTIVE_SESSION' : todayStatus?.status === 'Completed' ? 'SHIFT_ARCHIVED' : 'STANDBY_MODE'}
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
          <div className="glass-card p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                <Flame size={24} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Current Velocity</span>
                <span className="text-xl font-black text-white tracking-tighter">{metrics?.currentStreak || 0} DAY STREAK</span>
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
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Goal Sync</span>
                </div>
              </div>
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.03] border border-white/5">
                  <div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Target Hours</span>
                    <span className="text-2xl font-black text-white tracking-tighter">{metrics?.dailyGoalHours || 8}H</span>
                  </div>
                  <button onClick={() => { setTempGoal(metrics?.dailyGoalHours || 8); setActiveModal('goal'); }} className="p-4 bg-blue-600/10 text-blue-500 rounded-2xl">
                    <Settings size={22} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.03] border border-white/5">
                  <div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Actual Focus</span>
                    <span className="text-2xl font-black text-blue-500 tracking-tighter">{todayStatus?.studyHours?.toFixed(1) || 0}H</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-500">
                    <Clock size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pomodoro Focus Terminal */}
          {renderFocusTerminal()}
        </div>

        {/* Right Analytics & Tasks */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="xl:col-span-1">
              {renderDailyTasks()}
            </div>
            
            <div className="xl:col-span-1">
              <div className="glass-card p-6 rounded-[2.5rem] bg-orange-500/5 border border-orange-500/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Flame size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Current Velocity</span>
                    <span className="text-xl font-black text-white tracking-tighter">{metrics?.currentStreak || 0} DAY STREAK</span>
                  </div>
                </div>
                <button onClick={() => setActiveView('rank')} className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all">
                  <Trophy size={20} />
                </button>
              </div>
            </div>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="glass-card rounded-[3rem] p-5 sm:p-8 border border-white/5 shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500"><TrendingUp size={20} /></div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Rhythm Velocity</h2>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
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
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Subject Dominance</h2>
                </div>
                <div className="h-[250px]">
                   {subjectAnalytics.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
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
                        <p className="text-[10px] font-black uppercase tracking-widest">No Subject Data</p>
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
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Wall of <span className="text-blue-500">Excellence</span></h2>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-2">Global Ranking Registry</p>
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
      <div className="text-center">
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Weekly <span className="text-indigo-500">Rhythm</span></h2>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-2">Design Your Standard Study Pattern</p>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-4 custom-scrollbar no-scrollbar">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, idx) => (
          <button key={day} onClick={() => setRoutineDay(idx)} className={`min-w-[70px] p-4 rounded-2xl border transition-all flex flex-col items-center gap-1 ${routineDay === idx ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 border-white/10 text-gray-500'}`}>
            <span className="text-[8px] font-black uppercase tracking-widest">{day}</span>
            <span className="text-xs font-black italic">{weeklyRoutine.filter(r => r.dayOfWeek === idx).length} Nodes</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><PenLine size={20} /></div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Design Node</h3>
          </div>
          
          <form onSubmit={handleCreateRoutineNode} className="glass-card p-8 rounded-[3rem] bg-white/[0.03] border border-white/5 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Planned Subject</label>
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
              Inject Rhythm Node
            </button>
          </form>
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500"><LayoutGrid size={20} /></div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Active Pattern</h3>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
            {weeklyRoutine.filter(r => r.dayOfWeek === routineDay).length === 0 ? (
              <div className="text-center py-20 opacity-20 bg-white/[0.01] rounded-[3rem] border border-dashed border-white/10">
                <Calendar size={40} className="mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">No nodes for this day</p>
              </div>
            ) : (
              weeklyRoutine.filter(r => r.dayOfWeek === routineDay).map(node => (
                <div key={node.id} className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/5 flex items-center justify-between group">
                  <div>
                    <span className="text-lg font-bold text-white block leading-none">{node.subject}</span>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2 block">{formatDuration(node.estimatedMinutes)} TARGET</span>
                  </div>
                  <button onClick={() => handleDeleteRoutineNode(node.id)} className="p-3 text-red-500/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
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
  const renderHistory = () => (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8 pb-32 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Focus <span className="text-emerald-500">Vault</span></h2>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-2">Historical Session Registry</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4 mb-6 px-2">
             <div className="relative">
                <input 
                  type="date" 
                  onChange={(e) => handleSelectHistoryDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-black uppercase text-gray-400 focus:border-emerald-500 outline-none transition-all [color-scheme:dark]"
                />
             </div>
          </div>

          <div className="flex items-center gap-3 mb-2 px-2">
            <Calendar size={18} className="text-emerald-500" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Sessions</span>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {history.map((record) => (
              <button key={record.id} onClick={() => handleSelectHistoryDate(record.date)} className={`w-full p-5 rounded-[2rem] border transition-all text-left flex flex-col gap-1 ${selectedHistoryDate === record.date ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-gray-400 hover:border-emerald-500/30'}`}>
                <span className="text-xs font-black italic">{new Date(record.date).toLocaleDateString()}</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{record.studyHours?.toFixed(1) || 0}H Total Focus</span>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          {selectedHistoryDate ? (
            <div className="glass-card p-8 rounded-[3rem] border border-white/5 bg-white/[0.02] min-h-[400px]">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-white italic truncate">{new Date(selectedHistoryDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1">Deep Focus Detail</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-3 opacity-40 mb-6">
                    <div className="h-[1px] flex-1 bg-white" />
                    <span className="text-[8px] font-black uppercase tracking-[0.3em]">Session Summary</span>
                    <div className="h-[1px] flex-1 bg-white" />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-6 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20">
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-2">Total Time Invested</span>
                       <span className="text-4xl font-black text-white italic tracking-tighter">
                          {history.find(h => h.date?.split('T')[0] === selectedHistoryDate?.split('T')[0])?.studyHours?.toFixed(1) || 0} <span className="text-lg">HOURS</span>
                       </span>
                    </div>
                     
                     <div className="p-8 rounded-[3rem] bg-indigo-500/5 border border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><PenLine size={16} /></div>
                           <h4 className="text-sm font-black text-white uppercase tracking-tight">Rhythm Log</h4>
                        </div>
                        
                        <div className="space-y-3">
                           {historyTasks.length === 0 ? (
                             <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest italic text-center py-4">No preparations recorded for this day</p>
                           ) : (
                             historyTasks.map(task => (
                               <div key={task.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                 <div className="flex items-center gap-3">
                                   <div className={`w-2 h-2 rounded-full ${task.isCompleted ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                                   <span className={`text-[12px] font-bold ${task.isCompleted ? 'text-white' : 'text-gray-500'}`}>{task.title}</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                   {task.estimatedMinutes && <span className="text-[9px] text-gray-600 font-bold uppercase">{formatDuration(task.estimatedMinutes)}</span>}
                                   {task.isCompleted ? (
                                     <span className="text-[8px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-2 py-1 rounded-lg">VERIFIED</span>
                                   ) : (
                                     <span className="text-[8px] font-black text-gray-600 uppercase bg-white/5 px-2 py-1 rounded-lg">PENDING</span>
                                   )}
                                 </div>
                               </div>
                             ))
                           )}
                        </div>
                     </div>

                     <p className="text-[10px] text-gray-500 font-bold text-center mt-6 italic">"Registry records are verified and finalized."</p>
                  </div>
               </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 glass-card rounded-[3rem] border border-dashed border-white/10 opacity-30 h-full">
              <History size={48} className="mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-center">Select a date to unlock registry detail</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

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

          <button onClick={handleLogout} className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all active:scale-90">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-8 pb-20">
        <AnimatePresence mode="wait">
          {activeView === 'hub' && renderHub()}
          {activeView === 'rank' && renderRank()}
          {activeView === 'routine' && renderRoutineBuilder()}
          {activeView === 'history' && renderHistory()}
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
                <p className="text-[11px] text-white/70 font-black uppercase tracking-[0.2em]">Terminal Rhythms Completed</p>
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
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-4">
        <div className="bg-[#0B0D17]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 flex items-center justify-around shadow-[0_25px_50px_-12px_rgba(59,130,246,0.3)]">
          <button onClick={() => setActiveView('hub')} className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${activeView === 'hub' ? 'text-blue-500 scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
            <LayoutGrid size={24} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Hub</span>
          </button>

          <button onClick={() => setActiveView('rank')} className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${activeView === 'rank' ? 'text-blue-500 scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
            <Trophy size={24} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Rank</span>
          </button>

          <div className="relative">
            <button onClick={() => setActiveModal('qr')} className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all active:scale-90 -mt-10 border-4 border-[#0B0D17] ${activeModal === 'qr' ? 'bg-indigo-600 scale-110' : todayStatus?.status === 'In Library' ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}>
              <Camera size={30} />
            </button>
          </div>

          <button onClick={() => setActiveView('routine')} className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${activeView === 'routine' ? 'text-blue-500 scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
            <Calendar size={24} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Routine</span>
          </button>

          <button onClick={() => setActiveView('history')} className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${activeView === 'history' ? 'text-blue-500 scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
            <History size={24} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Vault</span>
          </button>
        </div>
      </div>

      {/* --- OVERLAYS --- */}
      <AnimatePresence>
        {activeModal === 'qr' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModal(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-zinc-900 border border-white/10 p-8 rounded-[3rem] w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white">Registry Auth</h3>
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
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Target Sync</h3>
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
      </AnimatePresence>
    </div>
  );
}
