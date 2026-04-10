import { Router } from "express";
import { login, forgotPassword, resetPassword, logout, register, verifyRegistration, completeRegistration, verifyLoginOtp } from "../controllers/auth.controller.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Auth routes with rate limiting
router.post("/login", authRateLimiter, login);
router.post("/verify-login-otp", authRateLimiter, verifyLoginOtp);
router.post("/register", authRateLimiter, register);
router.post("/verify-registration", authRateLimiter, verifyRegistration);
router.post("/complete-registration", authRateLimiter, completeRegistration);
router.post("/forgot-password", authRateLimiter, forgotPassword);
router.post("/reset-password", authRateLimiter, resetPassword);
router.post("/logout", authenticate, logout);

export default router;
