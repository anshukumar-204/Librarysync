import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import { apiRateLimiter } from "./middlewares/rateLimiter.js";

const app = express();

// Crucial for Render/Cloud platforms to identify real user IPs
app.set("trust proxy", 1);

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://cheerful-sfogliatella-8ee1fa.netlify.app"
      ],
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

// Export for server.ts
export default app;
