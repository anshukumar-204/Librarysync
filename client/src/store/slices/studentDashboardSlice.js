import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import dashboardApi from '../../services/dashboardApi';
import attendanceApi from '../../services/attendanceApi';
import * as studentApi from '../../services/studentApi';

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
      const response = await dashboardApi.getStudentHistory();
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

export const autoMarkAttendance = createAsyncThunk(
  'studentDashboard/markAttendance',
  async (scannedToken, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.markAttendance(scannedToken || 'LIBRARY_NODE_QR_MOCK');
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
    qrToken: null,
    loading: false,
    error: null,
    actionLoading: false, 
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
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
      .addCase(fetchMetrics.fulfilled, (state, action) => {
        state.metrics = action.payload;
      })
      
      // History
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      })

      // Leaderboard
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.leaderboard = action.payload;
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
        state.studyLogs.unshift(action.payload);
      })

      // Mark Attendance
      .addCase(autoMarkAttendance.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(autoMarkAttendance.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (state.todayStatus) {
           if (action.payload.status === 'In Library') {
              state.todayStatus.status = 'In Library';
              state.todayStatus.checkIn = new Date().toISOString();
           } else if (action.payload.status === 'Completed') {
              state.todayStatus.status = 'Completed';
              state.todayStatus.checkOut = new Date().toISOString();
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
      // Generate QR
      .addCase(generateQR.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(generateQR.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.qrToken = action.payload;
      })
      .addCase(generateQR.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError } = studentDashboardSlice.actions;
export default studentDashboardSlice.reducer;
