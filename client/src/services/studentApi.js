import API from './api';

export const fetchStudents = async () => {
  const response = await API.get('/students');
  return response.data;
};

export const createStudent = async (studentData) => {
  const response = await API.post('/students', studentData);
  return response.data;
};

export const updateStudent = async (id, studentData) => {
  const response = await API.put(`/students/${id}`, studentData);
  return response.data;
};

export const deleteStudent = async (id) => {
  const response = await API.delete(`/students/${id}`);
  return response.data;
};

// Productivity Features
export const fetchLeaderboard = async () => {
  const response = await API.get('/students/leaderboard');
  return response.data;
};

export const updateDailyGoal = async (dailyGoalHours) => {
  const response = await API.put('/students/goal', { dailyGoalHours });
  return response.data;
};

export const fetchStudyLogs = async () => {
  const response = await API.get('/students/logs');
  return response.data;
};

export const createStudyLog = async (logData) => {
  const response = await API.post('/students/logs', logData);
  return response.data;
};
