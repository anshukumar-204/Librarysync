import { Router } from "express";
import { authenticate, requireVerified } from "../middlewares/auth.middleware.js";
import { getTodayStatus, getHistory, getConsistencyMetrics } from "../controllers/student-dashboard.controller.js";
import { getLiveAttendance, getAttendanceFilters } from "../controllers/admin-dashboard.controller.js";
const router = Router();
router.use(authenticate, requireVerified);
// STUDENT DASHBOARD ROUTES
router.get("/student/today", getTodayStatus);
router.get("/student/history", getHistory);
router.get("/student/metrics", getConsistencyMetrics);
// ADMIN DASHBOARD ROUTES
router.get("/admin/live", getLiveAttendance);
router.get("/admin/filters", getAttendanceFilters);
export default router;
//# sourceMappingURL=dashboard.routes.js.map