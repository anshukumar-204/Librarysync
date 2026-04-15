import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import dashboardApi from '../../services/dashboardApi';

const getNormalizedAttendanceStats = (payload) => {
  const source = payload?.data ?? payload ?? {};
  const records = Array.isArray(source)
    ? source
    : Array.isArray(source.records)
      ? source.records
      : [];

  return {
    totalPresent: source.totalPresent ?? source.total ?? records.length,
    currentlyInside: source.currentlyInside ?? records.filter((record) => !record.checkOutTime).length,
    completed: source.completed ?? records.filter((record) => !!record.checkOutTime).length,
    records,
  };
};

export const fetchAdminLiveStats = createAsyncThunk(
  'adminDashboard/fetchLiveStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getAdminLiveAttendance();
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch live stats');
    }
  }
);

export const fetchAdminTrends = createAsyncThunk(
  'adminDashboard/fetchTrends',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getAdminAttendanceTrends();
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch trends');
    }
  }
);

export const fetchAdminHistory = createAsyncThunk(
  'adminDashboard/fetchHistory',
  async (params, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getAdminAttendanceFilters(params);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch history');
    }
  }
);

export const forceAdminCheckout = createAsyncThunk(
  'adminDashboard/forceCheckout',
  async ({ attendanceId, checkOutTime, selectedDate, isTodaySelected }, { dispatch, rejectWithValue }) => {
    try {
      const response = await dashboardApi.forceAdminCheckout(attendanceId, checkOutTime);
      if (isTodaySelected) {
        dispatch(fetchAdminLiveStats());
      } else if (selectedDate) {
        dispatch(fetchAdminHistory({ date: selectedDate }));
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to perform rescue checkout');
    }
  }
);

const adminDashboardSlice = createSlice({
  name: 'adminDashboard',
  initialState: {
    liveStats: {
      totalPresent: 0,
      currentlyInside: 0,
      completed: 0,
      records: []
    },
    trends: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminLiveStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminLiveStats.fulfilled, (state, action) => {
        state.loading = false;
        state.liveStats = getNormalizedAttendanceStats(action.payload);
      })
      .addCase(fetchAdminLiveStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAdminHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.liveStats = getNormalizedAttendanceStats(action.payload);
      })
      .addCase(fetchAdminHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAdminTrends.fulfilled, (state, action) => {
        state.trends = action.payload;
      });
  }
});

export default adminDashboardSlice.reducer;
