import rateLimit from "express-rate-limit";

// Limit repeated login / OTP requests to prevent brute-force
// Relaxed to 20 to allow multiple students from same Library WiFi/Network
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Network Security Alert: Too many login attempts from this connection. Please wait 15 minutes."
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});

// Standard API limiter for general routes
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 2000, 
  message: {
    success: false,
    message: "Too many requests, please try again later."
  }
});
