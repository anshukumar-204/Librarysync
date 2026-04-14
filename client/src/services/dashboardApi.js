import API from './api.js';

const dashboardApi = {
  getStudentTodayStatus: async () => {
    const response = await API.get('/dashboard/student/today');
    return response.data;
  },
  
  getStudentHistory: async (limit = 30) => {
    const response = await API.get(`/dashboard/student/history?limit=${limit}`);
    return response.data;
  },

  getStudentMetrics: async () => {
    const response = await API.get('/dashboard/student/metrics');
    return response.data;
  },

  getAdminLiveAttendance: async () => {
    const response = await API.get('/dashboard/admin/live');
    return response.data;
  },

  getAdminAttendanceTrends: async () => {
    const response = await API.get('/dashboard/admin/trends');
    return response.data;
  },

  getAdminAttendanceFilters: async (params) => {
    const response = await API.get('/dashboard/admin/filters', { params });
    return response.data;
  },
  
  forceAdminCheckout: async (attendanceId, checkOutTime) => {
    const response = await API.post('/dashboard/admin/force-checkout', { attendanceId, checkOutTime });
    return response.data;
  }
};

export default dashboardApi;
