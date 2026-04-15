import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authApi from '../../services/authApi';

// Initial state helpers
const token = localStorage.getItem('token');
const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
const sessionId = localStorage.getItem('sessionId');

const persistSession = (response) => {
  if (!response?.accessToken) return;
  localStorage.setItem('token', response.accessToken);
  localStorage.setItem('user', JSON.stringify(response.user));
  if (response.sessionId) localStorage.setItem('sessionId', response.sessionId);
  else localStorage.removeItem('sessionId');
};

const clearPersistedSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('sessionId');
};

export const loginAdmin = createAsyncThunk(
  'adminAuth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      persistSession(response);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Authentication failed');
    }
  }
);

export const registerStudent = createAsyncThunk(
  'adminAuth/register',
  async (studentData, { rejectWithValue }) => {
    try {
      const response = await authApi.register(studentData);
      persistSession(response);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const verifyLoginOtpAdmin = createAsyncThunk(
  'adminAuth/verifyLoginOtp',
  async ({ loginId, otp }, { rejectWithValue }) => {
    try {
      const response = await authApi.verifyLoginOtp(loginId, otp);
      persistSession(response);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'OTP verification failed');
    }
  }
);

export const forgotPasswordAdmin = createAsyncThunk(
  'adminAuth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      return await authApi.forgotPassword(email);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send OTP');
    }
  }
);

export const resetPasswordAdmin = createAsyncThunk(
  'adminAuth/resetPassword',
  async (resetData, { rejectWithValue }) => {
    try {
      return await authApi.resetPassword(resetData);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to reset password');
    }
  }
);

export const logoutAdmin = createAsyncThunk(
  'adminAuth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      clearPersistedSession();
      return true;
    } catch (err) {
      clearPersistedSession();
      return rejectWithValue(err.message);
    }
  }
);

export const firebaseSyncAuth = createAsyncThunk(
  'adminAuth/firebaseSync',
  async (firebaseData, { rejectWithValue }) => {
    try {
      const response = await authApi.firebaseSync(firebaseData);
      persistSession(response);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Firebase synchronization failed');
    }
  }
);

const authSlice = createSlice({
  name: 'adminAuth',
  initialState: {
    user: storedUser,
    token: token,
    sessionId: sessionId,
    loading: false,
    error: null,
    status: 'idle', // idle | loading | succeeded | failed
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setAuthSession: (state, action) => {
      const response = action.payload;
      persistSession(response);
      state.user = response?.user ?? null;
      state.token = response?.accessToken ?? null;
      state.sessionId = response?.sessionId ?? null;
      state.loading = false;
      state.error = null;
    },
    clearAuthSession: (state) => {
      clearPersistedSession();
      state.user = null;
      state.token = null;
      state.sessionId = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload.requiresOtp) {
          state.user = action.payload.user;
          state.token = action.payload.accessToken;
          state.sessionId = action.payload.sessionId;
        }
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.sessionId = action.payload.sessionId;
      })
      .addCase(registerStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Verify OTP
      .addCase(verifyLoginOtpAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyLoginOtpAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.sessionId = action.payload.sessionId;
      })
      .addCase(verifyLoginOtpAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.sessionId = null;
        state.loading = false;
      })
      .addCase(logoutAdmin.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.sessionId = null;
        state.loading = false;
      })
      // Firebase Sync
      .addCase(firebaseSyncAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(firebaseSyncAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.sessionId = action.payload.sessionId;
      })
      .addCase(firebaseSyncAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setAuthSession, clearAuthSession } = authSlice.actions;
export default authSlice.reducer;
