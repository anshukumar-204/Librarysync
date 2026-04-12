import { configureStore } from '@reduxjs/toolkit';
import studentReducer from '../features/students/studentSlice';
import adminAuthReducer from './slices/authSlice';
import studentDashboardReducer from './slices/studentDashboardSlice';
import adminDashboardReducer from './slices/adminDashboardSlice';
import feeReducer from './slices/feeSlice';

export const store = configureStore({
  reducer: {
    students: studentReducer,
    adminAuth: adminAuthReducer,
    studentDashboard: studentDashboardReducer,
    adminDashboard: adminDashboardReducer,
    fees: feeReducer,
  },
});
