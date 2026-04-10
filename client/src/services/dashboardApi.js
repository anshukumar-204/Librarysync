import API from './api.js';

const dashboardApi = {
  getStudentTodayStatus: async () => {
    const response = await API.get('/dashboard/student/today');
    return response.data;
  },
  
  getStudentHistory: async () => {
    const response = await API.get('/dashboard/student/history');
    return response.data;
  },

  getStudentMetrics: async () => {
    const response = await API.get('/dashboard/student/metrics');
    return response.data;
  }
};

export default dashboardApi;
