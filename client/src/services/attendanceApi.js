import API from './api.js';

const attendanceApi = {
  generateQR: async () => {
    const response = await API.post('/attendance/generate-qr');
    return response.data;
  },
  
  markAttendance: async (qrToken) => {
    const response = await API.post('/attendance/mark', { qrToken });
    return response.data;
  }
};

export default attendanceApi;
