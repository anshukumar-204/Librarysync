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

export const deleteStudyLog = async (id) => {
  const response = await API.delete(`/students/logs/${id}`);
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
