import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import dashboardApi from '../../services/dashboardApi';

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
  async ({ attendanceId, checkOutTime }, { dispatch, rejectWithValue }) => {
    try {
      const response = await dashboardApi.forceAdminCheckout(attendanceId, checkOutTime);
      dispatch(fetchAdminLiveStats()); // Refresh table
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
      })
      .addCase(fetchAdminLiveStats.fulfilled, (state, action) => {
        state.loading = false;
        state.liveStats = action.payload;
      })
      .addCase(fetchAdminLiveStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAdminHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminHistory.fulfilled, (state, action) => {
        state.loading = false;
        // When fetching history, we replace the records in liveStats for display
        state.liveStats.records = action.payload;
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
