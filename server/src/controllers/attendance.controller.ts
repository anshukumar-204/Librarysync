import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { getTodayDateRange, getMidnightDate } from "../utils/time.js";

// Generates a mock "QR Token" for the student.
export const generateStudentQR = async (req: Request, res: Response) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    
    if (!student) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }

    // In a real production system, this could be an encrypted short-lived JWT.
    // For now, it returns the student ID wrapped securely.
    const qrData = JSON.stringify({ studentId: student.id, timestamp: Date.now() });
    const qrToken = Buffer.from(qrData).toString("base64");

    return res.json({ success: true, qrToken });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// CORE FEATURE: Smart Attendance Logic
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { qrToken } = req.body;
    
    if (!qrToken) {
      return res.status(400).json({ success: false, message: "Scanner data (QR Token) is required" });
    }

    // STRICT CHECK: Only allow the library's physical station QR
    const stationSecret = process.env.LIBRARY_STATION_SECRET || "LIBRARY_NODE_QR_MOCK";
    if (qrToken !== stationSecret) {
      return res.status(403).json({ 
        success: false, 
        message: "Invalid Scanner Node. Please scan the official QR code displayed at the library entrance." 
      });
    }

    // Identify the student using their logged-in session, not the QR code!
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }
    const studentId = student.id;

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
      // --- STREAK CALCULATION LOGIC ---
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let newStreak = 1;
      let lastDate = student.lastAttendanceDate;
      
      if (lastDate) {
        const last = new Date(lastDate);
        last.setHours(0, 0, 0, 0);
        
        const diffTime = today.getTime() - last.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day
          newStreak = student.currentStreak + 1;
        } else if (diffDays === 2 && today.getDay() === 1) {
          // Sunday Exception: Last was Saturday, today is Monday
          newStreak = student.currentStreak + 1;
        } else if (diffDays === 0) {
          // Already have a streak for today (safety check)
          newStreak = student.currentStreak;
        } else {
          // Streak broken
          newStreak = 1;
        }
      }

      // Record attendance and update streak transactionally
      await prisma.$transaction([
        prisma.attendance.create({
          data: {
            studentId,
            date: todayMidnight,
            checkInTime: new Date()
          }
        }),
        prisma.student.update({
          where: { id: studentId },
          data: {
            currentStreak: newStreak,
            maxStreak: Math.max(student.maxStreak, newStreak),
            lastAttendanceDate: today
          }
        })
      ]);

      return res.json({ 
        success: true, 
        message: "Check-in successful", 
        status: "In Library",
        streak: newStreak
      });
    }

    // Case 2: Second Scan -> Check-out
    if (existingRecord.checkInTime && !existingRecord.checkOutTime) {
      // Logic: Allow check-out only after 2 minutes of check-in
      const checkInTime = new Date(existingRecord.checkInTime).getTime();
      const currentTime = new Date().getTime();
      const diffMinutes = (currentTime - checkInTime) / (1000 * 60);

      if (diffMinutes < 2) {
        const remainingSeconds = Math.ceil(120 - (currentTime - checkInTime) / 1000);
        return res.status(403).json({ 
          success: false, 
          message: `Too early to check out. Please wait ${remainingSeconds} more seconds to ensure session validity.`,
          status: "In Library"
        });
      }

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

  } catch (error) {
    console.error("Attendance Error:", error);
    return res.status(500).json({ success: false, message: "Server error occurred" });
  }
};
