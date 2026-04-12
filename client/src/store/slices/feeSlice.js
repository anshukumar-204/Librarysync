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

const initialState = {
  status: null,
  summary: null,
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
      })
      .addCase(getAdminFeeSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload.data;
      })
      .addCase(recordFeePayment.fulfilled, (state) => {
        state.loading = false;
        // Optionally trigger a refresh or update locally
      });
  }
});

export const { clearSummary } = feeSlice.actions;
export default feeSlice.reducer;
