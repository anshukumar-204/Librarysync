import { Router } from "express";
import { generateStudentQR, markAttendance } from "../controllers/attendance.controller.js";
import { authenticate, requireVerified } from "../middlewares/auth.middleware.js";
const router = Router();
// Endpoint for the QR Scanner device/app to submit the scanned token
router.post("/scan", markAttendance);
// Endpoint for Students to generate their QR Code for the day
router.get("/generate-qr", authenticate, requireVerified, generateStudentQR);
export default router;
//# sourceMappingURL=attendance.routes.js.map