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
// Security Middlewares
app.use(helmet());
app.use(cors({
    origin: ["http://localhost:5173"], // Add frontend URLs here
    credentials: true,
}));
// Parsers
app.use(express.json());
app.use(cookieParser());
app.use(compression());
// General API Rate limit
app.use("/api", apiRateLimiter);
// Routes
app.get("/", (req, res) => {
    res.send("Library Attendance System API Running 🔥");
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
// Export for server.ts
export default app;
//# sourceMappingURL=app.js.map