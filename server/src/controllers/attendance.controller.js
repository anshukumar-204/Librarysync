import { prisma } from "../db/prisma.js";
import { getTodayDateRange, getMidnightDate } from "../utils/time.js";
// Generates a mock "QR Token" for the student.
export const generateStudentQR = async (req, res) => {
    try {
        const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
        if (!student) {
            return res.status(404).json({ success: false, message: "Student profile not found" });
        }
        // In a real production system, this could be an encrypted short-lived JWT.
        // For now, it returns the student ID wrapped securely.
        const qrData = JSON.stringify({ studentId: student.id, timestamp: Date.now() });
        const qrToken = Buffer.from(qrData).toString("base64");
        return res.json({ success: true, qrToken });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
// CORE FEATURE: Smart Attendance Logic
export const markAttendance = async (req, res) => {
    try {
        const { qrToken } = req.body;
        if (!qrToken) {
            return res.status(400).json({ success: false, message: "QR Token is required" });
        }
        let studentId;
        try {
            const decoded = JSON.parse(Buffer.from(qrToken, "base64").toString("utf8"));
            studentId = decoded.studentId;
            // Optional: Prevent replay attacks by checking timestamp age (e.g., max 10 seconds)
            const isExpired = Date.now() - decoded.timestamp > 30000; // 30 seconds
            if (isExpired) {
                return res.status(400).json({ success: false, message: "QR code expired. Generate a new one." });
            }
        }
        catch {
            return res.status(400).json({ success: false, message: "Invalid QR format" });
        }
        const { startOfDay, endOfDay } = getTodayDateRange();
        const todayMidnight = getMidnightDate(startOfDay);
        // Fetch existing attendance record for today
        const existingRecord = await prisma.attendance.findFirst({
            where: {
                studentId,
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });
        // Case 1: First Scan -> Check-in
        if (!existingRecord) {
            await prisma.attendance.create({
                data: {
                    studentId,
                    date: todayMidnight, // Stored as today's date
                    checkInTime: new Date()
                }
            });
            return res.json({ success: true, message: "Check-in successful", status: "In Library" });
        }
        // Case 2: Second Scan -> Check-out
        if (existingRecord.checkInTime && !existingRecord.checkOutTime) {
            await prisma.attendance.update({
                where: { id: existingRecord.id },
                data: { checkOutTime: new Date() }
            });
            return res.json({ success: true, message: "Check-out successful", status: "Completed" });
        }
        // Case 3: Third Attempt -> BLOCKED (Duplicate logic)
        if (existingRecord.checkInTime && existingRecord.checkOutTime) {
            return res.status(403).json({
                success: false,
                message: "Attendance locked. You have already checked out for today.",
                status: "Completed"
            });
        }
        return res.status(500).json({ success: false, message: "Unknown state" });
    }
    catch (error) {
        console.error("Attendance Error:", error);
        return res.status(500).json({ success: false, message: "Server error occurred" });
    }
};
//# sourceMappingURL=attendance.controller.js.map