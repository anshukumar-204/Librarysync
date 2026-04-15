import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as feeApi from '../../services/feeApi';

export const getFeeStatus = createAsyncThunk(
  'fees/getStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await feeApi.fetchFeeStatus();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Financial registry access denied");
    }
  }
);

export const getAdminFeeSummary = createAsyncThunk(
  'fees/getAdminSummary',
  async (studentId, { rejectWithValue }) => {
    try {
      const response = await feeApi.fetchSummaryForAdmin(studentId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to retrieve student ledger");
    }
  }
);

export const recordFeePayment = createAsyncThunk(
  'fees/recordPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await feeApi.recordPayment(paymentData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Payment sync failed");
    }
  }
);

export const getFeesRegistry = createAsyncThunk(
  'fees/getRegistry',
  async (_, { rejectWithValue }) => {
    try {
      const response = await feeApi.fetchFeesRegistry();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to load fee registry");
    }
  }
);

const initialState = {
  status: null,
  summary: null,
  registry: [],
  stats: {
    monthlyStats: []
  },
  loading: false,
  error: null,
};

const feeSlice = createSlice({
  name: 'fees',
  initialState,
  reducers: {
    clearSummary: (state) => {
      state.summary = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getFeeStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFeeStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.status = action.payload.data;
      })
      .addCase(getFeeStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getAdminFeeSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminFeeSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload.data;
      })
      .addCase(getAdminFeeSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getFeesRegistry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFeesRegistry.fulfilled, (state, action) => {
        state.loading = false;
        // Handle new structure: { registry, stats }
        if (action.payload.data?.registry) {
          state.registry = action.payload.data.registry;
          state.stats = action.payload.data.stats || { monthlyStats: [] };
        } else {
          state.registry = action.payload.data;
        }
      })
      .addCase(getFeesRegistry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(recordFeePayment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(recordFeePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearSummary } = feeSlice.actions;
export default feeSlice.reducer;
