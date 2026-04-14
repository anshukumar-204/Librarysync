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

export const resetStudentPassword = async (id, newPassword) => {
  const response = await API.put(`/students/${id}/reset-password`, { newPassword });
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

export const deleteStudyLog = async (id) => {
  const response = await API.delete(`/students/logs/${id}`);
  return response.data;
};

export const fetchSubjectAnalytics = async () => {
  const response = await API.get('/students/analytics/subjects');
  return response.data;
};

// Weekly Routine
export const fetchRoutine = async () => {
  const response = await API.get('/students/routine');
  return response.data;
};

export const createRoutineNode = async (routineData) => {
  const response = await API.post('/students/routine', routineData);
  return response.data;
};

export const deleteRoutineNode = async (id) => {
  const response = await API.delete(`/students/routine/${id}`);
  return response.data;
};

export const syncRoutine = async () => {
  const response = await API.post('/students/routine/sync');
  return response.data;
};

// Preparation Tasks
export const fetchTasks = async (date) => {
  const url = date ? `/students/tasks?date=${date}` : '/students/tasks';
  const response = await API.get(url);
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await API.post('/students/tasks', taskData);
  return response.data;
};

export const toggleTaskStatus = async (id, isCompleted) => {
  const response = await API.put(`/students/tasks/${id}`, { isCompleted });
  return response.data;
};

export const updateTask = async (id, taskData) => {
  const response = await API.patch(`/students/tasks/${id}`, taskData);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await API.delete(`/students/tasks/${id}`);
  return response.data;
};

// Profile Management (Self)
export const requestProfileUpdateOtp = async () => {
  const response = await API.post('/students/profile/otp');
  return response.data;
};

export const updateProfileSelf = async (profileData) => {
  const response = await API.patch('/students/profile', profileData);
  return response.data;
};

export const checkAvailability = async (availabilityData) => {
  const response = await API.post('/students/check-availability', availabilityData);
  return response.data;
};
