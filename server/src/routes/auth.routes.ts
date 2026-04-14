import { Router } from "express";
import { 
  login, forgotPassword, resetPassword, logout, register, 
  verifyRegistration, completeRegistration, verifyLoginOtp, 
  mailerHealthCheck, checkAccountExistence, firebaseSync
} from "../controllers/auth.controller.js";
import { checkAvailability } from "../controllers/student-validation.controller.js";
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
router.post("/check-account", authRateLimiter, checkAccountExistence);
router.post("/check-availability", authRateLimiter, checkAvailability);
router.post("/reset-password", authRateLimiter, resetPassword);
router.post("/firebase-sync", authRateLimiter, firebaseSync);
router.post("/logout", authenticate, logout);

// Debugging routes
router.get("/mailer-health", mailerHealthCheck);

export default router;
