import { Router } from "express";
import { login, forgotPassword, resetPassword, logout, register, verifyRegistration, completeRegistration, verifyLoginOtp } from "../controllers/auth.controller.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Auth routes (Rate limiting disabled as requested)
router.post("/login", login);
router.post("/verify-login-otp", verifyLoginOtp);
router.post("/register", register);
router.post("/verify-registration", verifyRegistration);
router.post("/complete-registration", completeRegistration);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", authenticate, logout);

export default router;
