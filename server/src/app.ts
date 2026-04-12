import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import feeRoutes from "./routes/fee.routes.js";
import { apiRateLimiter } from "./middlewares/rateLimiter.js";

const app = express();

// Crucial for Render/Cloud platforms to identify real user IPs
app.set("trust proxy", 1);

// Security Middlewares
app.use(helmet());
// Enhanced CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:4173",
      "https://librync-attendance.netlify.app",
      "https://librync-attendance.vercel.app",
      "https://cheerful-sfogliatella-8ee1fa.netlify.app"
    ];

console.log("[SECURITY] Allowed CORS Origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(o => origin.startsWith(o))) {
        callback(null, true);
      } else {
        console.warn(`[SECURITY] Blocked CORS request from origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Parsers
app.use(express.json());
app.use(cookieParser());
app.use(compression());

// General API Rate limit
app.use("/api", apiRateLimiter);

// Routes
app.get("/", (req: express.Request, res: express.Response) => {
  res.send("Library Attendance System API Running 🔥");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/fees", feeRoutes);

// Export for server.ts
export default app;
