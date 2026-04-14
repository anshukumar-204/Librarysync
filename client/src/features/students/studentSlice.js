import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as studentApi from '../../services/studentApi';

// Async Thunks
export const fetchStudents = createAsyncThunk(
  'students/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.fetchStudents();
      return response; // Return the entire body { success, data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch registry");
    }
  }
);

export const registerStudent = createAsyncThunk(
  'students/register',
  async (studentData, { rejectWithValue }) => {
    try {
      const response = await studentApi.createStudent(studentData);
      return response; // Return the entire body { success, data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Registration failure");
    }
  }
);

export const modifyStudent = createAsyncThunk(
  'students/update',
  async ({ id, studentData }, { rejectWithValue }) => {
    try {
      const response = await studentApi.updateStudent(id, studentData);
      return response; // Return the entire body { success, data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Update failure");
    }
  }
);

export const overridePassword = createAsyncThunk(
  'students/overridePassword',
  async ({ id, newPassword }, { rejectWithValue }) => {
    try {
      const response = await studentApi.resetStudentPassword(id, newPassword);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Security override failure");
    }
  }
);

const initialState = {
  students: [],
  loading: false,
  error: null,
  isEditModalOpen: false,
  editingStudent: null,
  editModalMode: 'edit',
};

const studentSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    openEditModal: (state, action) => {
      if (action.payload && action.payload.student) {
        state.editingStudent = action.payload.student;
        state.editModalMode = action.payload.mode || 'edit';
      } else {
        state.editingStudent = action.payload || null;
        state.editModalMode = 'edit';
      }
      state.isEditModalOpen = true;
    },
    closeEditModal: (state) => {
      state.isEditModalOpen = false;
      state.editingStudent = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Students
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Fetch Students
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload.data || [];
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register Student
      .addCase(registerStudent.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerStudent.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.students.unshift(action.payload.data);
        }
        state.isEditModalOpen = false;
        state.editingStudent = null;
      })
      .addCase(registerStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Modify Student
      .addCase(modifyStudent.pending, (state) => {
        state.loading = true;
      })
      .addCase(modifyStudent.fulfilled, (state, action) => {
        state.loading = false;
        const updatedStudent = action.payload.data;
        if (updatedStudent) {
          const index = state.students.findIndex(s => s.id === updatedStudent.id);
          if (index !== -1) {
            state.students[index] = updatedStudent;
          }
        }
        state.isEditModalOpen = false;
        state.editingStudent = null;
      })
      .addCase(modifyStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { openEditModal, closeEditModal } = studentSlice.actions;

export default studentSlice.reducer;
