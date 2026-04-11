import { Router } from "express";
import { 
  createStudent, 
  getStudents, 
  updateStudent,
  updateDailyGoal,
  getLeaderboard,
  createStudyLog,
  getStudyLogs,
  deleteStudyLog
} from "../controllers/student.controller.js";
import { authenticate, requireVerified } from "../middlewares/auth.middleware.js";

const router = Router();

// Routes for both Admin and Students (depending on specific permission logic inside controllers)
router.use(authenticate, requireVerified);

// Productivity & Profile Management (Students)
router.put("/goal", updateDailyGoal);
router.get("/leaderboard", getLeaderboard);
router.get("/logs", getStudyLogs);
router.post("/logs", createStudyLog);

// Registry Management (Admin usually)
router.post("/", createStudent); 
router.get("/", getStudents);
router.put("/:id", updateStudent);

export default router;
