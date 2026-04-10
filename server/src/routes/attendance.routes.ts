import { Router } from "express";
import { generateStudentQR, markAttendance } from "../controllers/attendance.controller.js";
import { authenticate, requireVerified } from "../middlewares/auth.middleware.js";

const router = Router();

// Endpoint for marking attendance (Student scans library QR or vice-versa)
router.post("/mark", authenticate, markAttendance);

// Endpoint for Students to generate their QR Code for the day
router.get("/generate-qr", authenticate, requireVerified, generateStudentQR);

export default router;
