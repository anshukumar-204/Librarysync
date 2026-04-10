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
    
    // For now, accept any non-empty qrToken (or you can specifically validate it matches a static string like "LIBRARY_CHECKIN_NODE")
    if (!qrToken) {
      return res.status(400).json({ success: false, message: "QR Token is required" });
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

  } catch (error) {
    console.error("Attendance Error:", error);
    return res.status(500).json({ success: false, message: "Server error occurred" });
  }
};
