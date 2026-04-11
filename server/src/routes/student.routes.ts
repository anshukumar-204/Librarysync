import { Router } from "express";
import { 
  createStudent, 
  getStudents, 
  updateStudent,
  updateDailyGoal,
  getLeaderboard,
  createStudyLog,
  getStudyLogs,
  deleteStudyLog,
  getTasks,
  createTask,
  toggleTaskStatus,
  deleteTask,
  updateTask,
  getWeeklyRoutine,
  createRoutineNode,
  deleteRoutineNode,
  syncRoutineTasks,
  getSubjectAnalytics
} from "../controllers/student.controller.js";
import { authenticate, requireVerified } from "../middlewares/auth.middleware.js";

const router = Router();

// Routes for both Admin and Students (depending on specific permission logic inside controllers)
router.use(authenticate, requireVerified);

// Productivity & Profile Management (Students)
router.put("/goal", updateDailyGoal);
router.get("/leaderboard", getLeaderboard);
router.get("/analytics/subjects", getSubjectAnalytics);
router.get("/logs", getStudyLogs);
router.post("/logs", createStudyLog);
router.delete("/logs/:id", deleteStudyLog);

// Weekly Routine
router.get("/routine", getWeeklyRoutine);
router.post("/routine", createRoutineNode);
router.delete("/routine/:id", deleteRoutineNode);
router.post("/routine/sync", syncRoutineTasks);

// Preparation Tasks
router.get("/tasks", getTasks);
router.post("/tasks", createTask);
router.put("/tasks/:id", toggleTaskStatus);
router.patch("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);

// Registry Management (Admin usually)
router.post("/", createStudent); 
router.get("/", getStudents);
router.put("/:id", updateStudent);

export default router;
