import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import dashboardApi from '../../services/dashboardApi';
import attendanceApi from '../../services/attendanceApi';
import * as studentApi from '../../services/studentApi';

const getAttendanceTimestamp = (payload, keys = []) => {
  for (const key of keys) {
    if (payload?.[key]) return payload[key];
  }
  return null;
};

export const requestProfileOtp = createAsyncThunk(
  'studentDashboard/requestProfileOtp',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.requestProfileUpdateOtp();
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to request update cipher');
    }
  }
);

export const updateProfileSelf = createAsyncThunk(
  'studentDashboard/updateProfileSelf',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await studentApi.updateProfileSelf(profileData);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to synchronize profile');
    }
  }
);

export const generateQR = createAsyncThunk(
  'studentDashboard/generateQR',
  async (_, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.generateQR();
      return response.qrToken;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to generate QR');
    }
  }
);

export const fetchTodayStatus = createAsyncThunk(
  'studentDashboard/fetchTodayStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getStudentTodayStatus();
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch status');
    }
  }
);

export const fetchMetrics = createAsyncThunk(
  'studentDashboard/fetchMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getStudentMetrics();
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch metrics');
    }
  }
);

export const fetchHistory = createAsyncThunk(
  'studentDashboard/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getStudentHistory(365);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch history');
    }
  }
);

export const fetchLeaderboard = createAsyncThunk(
  'studentDashboard/fetchLeaderboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.fetchLeaderboard();
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch leaderboard');
    }
  }
);

export const updateDailyGoal = createAsyncThunk(
  'studentDashboard/updateDailyGoal',
  async (hours, { rejectWithValue }) => {
    try {
      const response = await studentApi.updateDailyGoal(hours);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update goal');
    }
  }
);

export const fetchStudyLogs = createAsyncThunk(
  'studentDashboard/fetchStudyLogs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.fetchStudyLogs();
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch logs');
    }
  }
);

export const createStudyLog = createAsyncThunk(
  'studentDashboard/createStudyLog',
  async (logData, { rejectWithValue }) => {
    try {
      const response = await studentApi.createStudyLog(logData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create log');
    }
  }
);

export const deleteStudyLog = createAsyncThunk(
  'studentDashboard/deleteStudyLog',
  async (id, { rejectWithValue }) => {
    try {
      await studentApi.deleteStudyLog(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete log');
    }
  }
);

// Preparation Tasks
export const fetchTasks = createAsyncThunk(
  'studentDashboard/fetchTasks',
  async (date, { rejectWithValue }) => {
    try {
      const response = await studentApi.fetchTasks(date);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const createTask = createAsyncThunk(
  'studentDashboard/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await studentApi.createTask(taskData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create task');
    }
  }
);

export const toggleTaskStatus = createAsyncThunk(
  'studentDashboard/toggleTaskStatus',
  async ({ id, isCompleted }, { rejectWithValue }) => {
    try {
      const response = await studentApi.toggleTaskStatus(id, isCompleted);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'studentDashboard/deleteTask',
  async (id, { rejectWithValue }) => {
    try {
      await studentApi.deleteTask(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'studentDashboard/updateTask',
  async ({ id, title, estimatedMinutes, priority }, { rejectWithValue }) => {
    try {
      const response = await studentApi.updateTask(id, { title, estimatedMinutes, priority });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update task');
    }
  }
);

export const fetchHistoryTasks = createAsyncThunk(
  'studentDashboard/fetchHistoryTasks',
  async (date, { rejectWithValue }) => {
    try {
      const response = await studentApi.fetchTasks(date);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch history tasks');
    }
  }
);


export const fetchRoutine = createAsyncThunk(
  'studentDashboard/fetchRoutine',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.fetchRoutine();
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch routine');
    }
  }
);

export const createRoutineNode = createAsyncThunk(
  'studentDashboard/createRoutineNode',
  async (nodeData, { rejectWithValue }) => {
    try {
      const response = await studentApi.createRoutineNode(nodeData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create routine node');
    }
  }
);

export const syncRoutine = createAsyncThunk(
  'studentDashboard/syncRoutine',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.syncRoutine();
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Sync failed');
    }
  }
);

export const deleteRoutineNode = createAsyncThunk(
  'studentDashboard/deleteRoutineNode',
  async (id, { rejectWithValue }) => {
    try {
      await studentApi.deleteRoutineNode(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete routine node');
    }
  }
);

export const fetchSubjectAnalytics = createAsyncThunk(
  'studentDashboard/fetchSubjectAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.fetchSubjectAnalytics();
      // response is already response.data (the {success, data} object)
      // so response.data is the actual array
      return Array.isArray(response.data) ? response.data : (response.data || []);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

export const autoMarkAttendance = createAsyncThunk(
  'studentDashboard/markAttendance',
  async (scannedToken, { rejectWithValue }) => {
    try {
      if (!scannedToken) return rejectWithValue('Scan Token is required');
      const response = await attendanceApi.markAttendance(scannedToken);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark attendance');
    }
  }
);

const studentDashboardSlice = createSlice({
  name: 'studentDashboard',
  initialState: {
    todayStatus: null,
    metrics: null,
    history: [],
    leaderboard: [],
    studyLogs: [],
    tasks: [],
    weeklyRoutine: [],
    subjectAnalytics: [],
    historyTasks: [],
    historyTasksLoading: false,
    qrToken: null,
    loading: false,
    error: null,
    actionLoading: false, 
    // Pomodoro State (Persistent across navigation)
    pomodoro: (() => {
      const saved = localStorage.getItem('pomodoro_settings');
      const defaultSettings = {
        mode: 'focus', // 'focus' | 'break'
        focusDuration: 25,
        breakDuration: 5,
        timeLeft: 25 * 60,
        isRunning: false,
        sessionsCompleted: 0
      };
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { ...defaultSettings, ...parsed, isRunning: false, timeLeft: parsed.focusDuration * 60 };
        } catch (e) {
          return defaultSettings;
        }
      }
      return defaultSettings;
    })()
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updatePomodoro: (state, action) => {
      state.pomodoro = { ...state.pomodoro, ...action.payload };
    },
    tickPomodoro: (state) => {
      if (state.pomodoro.isRunning && state.pomodoro.timeLeft > 0) {
        state.pomodoro.timeLeft -= 1;
      }
    },
    savePomodoroSettings: (state) => {
      localStorage.setItem('pomodoro_settings', JSON.stringify({
        focusDuration: state.pomodoro.focusDuration,
        breakDuration: state.pomodoro.breakDuration,
        mode: state.pomodoro.mode
      }));
    }
  },
  extraReducers: (builder) => {
    builder
      // Today Status
      .addCase(fetchTodayStatus.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTodayStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.todayStatus = action.payload;
      })
      .addCase(fetchTodayStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Metrics
      .addCase(fetchMetrics.pending, (state) => { state.loading = true; })
      .addCase(fetchMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
      })
      .addCase(fetchMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // History
      .addCase(fetchHistory.pending, (state) => { state.loading = true; })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Leaderboard
      .addCase(fetchLeaderboard.pending, (state) => { state.loading = true; })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.leaderboard = action.payload;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // History Tasks
      .addCase(fetchHistoryTasks.pending, (state) => { state.historyTasksLoading = true; })
      .addCase(fetchHistoryTasks.fulfilled, (state, action) => {
        state.historyTasksLoading = false;
        state.historyTasks = action.payload;
      })
      .addCase(fetchHistoryTasks.rejected, (state, action) => {
        state.historyTasksLoading = false;
        state.error = action.payload;
      })

      // Goal Update
      .addCase(updateDailyGoal.fulfilled, (state, action) => {
        if (state.metrics) {
          state.metrics.dailyGoalHours = action.payload.dailyGoalHours;
        }
      })

      // Study Logs
      .addCase(fetchStudyLogs.fulfilled, (state, action) => {
        state.studyLogs = action.payload;
      })
      .addCase(createStudyLog.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.studyLogs.unshift(action.payload);
      })
      .addCase(deleteStudyLog.fulfilled, (state, action) => {
        state.studyLogs = state.studyLogs.filter(log => log.id !== action.payload);
      })
      
      // Tasks
      .addCase(fetchTasks.pending, (state) => { state.loading = true; })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.tasks.unshift(action.payload);
      })
      .addCase(toggleTaskStatus.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.payload.id);
        if (index !== -1) state.tasks[index] = action.payload;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t.id !== action.payload);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.tasks.findIndex(t => t.id === action.payload.id);
        if (index !== -1) state.tasks[index] = action.payload;
      })

      // Weekly Routine
      .addCase(fetchRoutine.pending, (state) => { state.loading = true; })
      .addCase(fetchRoutine.fulfilled, (state, action) => {
        state.loading = false;
        state.weeklyRoutine = action.payload;
      })
      .addCase(fetchRoutine.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createRoutineNode.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.weeklyRoutine.push(action.payload);
      })
      .addCase(deleteRoutineNode.fulfilled, (state, action) => {
        state.weeklyRoutine = state.weeklyRoutine.filter(r => r.id !== action.payload);
      })
      .addCase(syncRoutine.fulfilled, (state, action) => {
        state.actionLoading = false;
        const syncedTasks = Array.isArray(action.payload) ? action.payload : [];
        if (syncedTasks.length > 0) {
          const existingTasks = state.tasks.filter(
            (task) => !syncedTasks.some((syncedTask) => syncedTask.id === task.id)
          );
          state.tasks = [...syncedTasks, ...existingTasks];
        }
      })

      // Analytics
      .addCase(fetchSubjectAnalytics.pending, (state) => { state.loading = true; })
      .addCase(fetchSubjectAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        // Always ensure subjectAnalytics is an array to prevent .length crashes
        state.subjectAnalytics = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchSubjectAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Mark Attendance
      .addCase(autoMarkAttendance.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(autoMarkAttendance.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (state.todayStatus) {
           const checkInTimestamp = getAttendanceTimestamp(action.payload, ['checkIn', 'checkInTime']);
           const checkOutTimestamp = getAttendanceTimestamp(action.payload, ['checkOut', 'checkOutTime']);
           if (action.payload.status === 'In Library') {
              state.todayStatus.status = 'In Library';
              state.todayStatus.checkIn = checkInTimestamp || state.todayStatus.checkIn;
           } else if (action.payload.status === 'Completed') {
              state.todayStatus.status = 'Completed';
              state.todayStatus.checkOut = checkOutTimestamp || state.todayStatus.checkOut;
           }
        }
        // Update streak if returned from server
        if (action.payload.streak && state.metrics) {
          state.metrics.currentStreak = action.payload.streak;
        }
      })
      .addCase(autoMarkAttendance.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(generateQR.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // Generic Action Loading Protections
      .addCase(updateProfileSelf.pending, (state) => { state.actionLoading = true; })
      .addCase(updateProfileSelf.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload?.data?.student) {
          state.metrics = state.metrics
            ? { ...state.metrics, student: action.payload.data.student }
            : { student: action.payload.data.student };
        }
      })
      .addCase(updateProfileSelf.rejected, (state) => { state.actionLoading = false; })

      .addCase(createTask.pending, (state) => { state.actionLoading = true; })
      .addCase(createTask.rejected, (state) => { state.actionLoading = false; })
      
      .addCase(updateTask.pending, (state) => { state.actionLoading = true; })
      .addCase(updateTask.rejected, (state) => { state.actionLoading = false; })
      
      .addCase(createStudyLog.pending, (state) => { state.actionLoading = true; })
      .addCase(createStudyLog.rejected, (state) => { state.actionLoading = false; })
      
      .addCase(createRoutineNode.pending, (state) => { state.actionLoading = true; })
      .addCase(createRoutineNode.rejected, (state) => { state.actionLoading = false; })
      
      .addCase(syncRoutine.pending, (state) => { state.actionLoading = true; })
      .addCase(syncRoutine.rejected, (state) => { state.actionLoading = false; });
  }
});

export const { clearError, updatePomodoro, tickPomodoro, savePomodoroSettings } = studentDashboardSlice.actions;
export default studentDashboardSlice.reducer;
