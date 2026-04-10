import { Router } from "express";
import { preAuthLogin, verifyLoginOtp, logout } from "../controllers/auth.controller.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";
import { authenticate } from "../middlewares/auth.middleware.js";
const router = Router();
// Routes strictly guarded by the authRateLimiter
router.post("/login", authRateLimiter, preAuthLogin);
router.post("/verify-otp", authRateLimiter, verifyLoginOtp);
router.post("/logout", authenticate, logout);
export default router;
//# sourceMappingURL=auth.routes.js.map