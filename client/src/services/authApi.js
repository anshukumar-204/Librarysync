import API from './api';

const authApi = {
  login: async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (studentData) => {
    const response = await API.post('/auth/register', studentData);
    return response.data;
  },

  verifyRegistration: async (credential) => {
    const response = await API.post('/auth/verify-registration', { credential });
    return response.data;
  },

  verifyLoginOtp: async (loginId, otp) => {
    const response = await API.post('/auth/verify-login-otp', { loginId, otp });
    return response.data;
  },

  completeRegistration: async (credential, otp) => {
    const response = await API.post('/auth/complete-registration', { credential, otp });
    return response.data;
  },
  
  forgotPassword: async (email) => {
    const response = await API.post('/auth/forgot-password', { email });
    return response.data;
  },

  checkAccountExistence: async (email) => {
    const response = await API.post('/auth/check-account', { email });
    return response.data;
  },
  
  resetPassword: async (resetData) => {
    const response = await API.post('/auth/reset-password', resetData);
    return response.data;
  },
  
  logout: async () => {
    const response = await API.post('/auth/logout');
    return response.data;
  },

  checkAvailability: async (availabilityData) => {
    const response = await API.post('/auth/check-availability', availabilityData);
    return response.data;
  },
  
  firebaseSync: async (firebaseData) => {
    const payload = typeof firebaseData === 'string'
      ? { idToken: firebaseData }
      : firebaseData;
    const response = await API.post('/auth/firebase-sync', payload);
    return response.data;
  }
};

export default authApi;
