import { Router } from "express";
import { authenticate, requireVerified } from "../middlewares/auth.middleware.js";
import { getTodayStatus, getHistory, getConsistencyMetrics } from "../controllers/student-dashboard.controller.js";
import { getLiveAttendance, getAttendanceFilters, getAttendanceTrends } from "../controllers/admin-dashboard.controller.js";

const router = Router();

router.use(authenticate, requireVerified);

// STUDENT DASHBOARD ROUTES
router.get("/student/today", getTodayStatus);
router.get("/student/history", getHistory);
router.get("/student/metrics", getConsistencyMetrics);

// ADMIN DASHBOARD ROUTES
router.get("/admin/live", getLiveAttendance);
router.get("/admin/filters", getAttendanceFilters);
router.get("/admin/trends", getAttendanceTrends);

export default router;
