import { configureStore } from '@reduxjs/toolkit';
import studentReducer from '../features/students/studentSlice';
import adminAuthReducer from './slices/authSlice';
import studentDashboardReducer from './slices/studentDashboardSlice';

export const store = configureStore({
  reducer: {
    students: studentReducer,
    adminAuth: adminAuthReducer,
    studentDashboard: studentDashboardReducer,
  },
});
