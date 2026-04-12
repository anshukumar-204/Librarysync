import { Router } from "express";
import { getStudentFeeSummary, recordFeePayment, updateStudentMonthlyFee, getFeesRegistry } from "../controllers/fee.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Student routes (Self view)
router.get("/status", authenticate, getStudentFeeSummary);

// Admin routes
router.get("/registry", authenticate, getFeesRegistry);
router.get("/summary/:studentId", authenticate, getStudentFeeSummary);
router.post("/record", authenticate, recordFeePayment);
router.patch("/update-tariff", authenticate, updateStudentMonthlyFee);

export default router;
