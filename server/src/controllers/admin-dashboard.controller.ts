import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { getTodayDateRange } from "../utils/time.js";

export const getLiveAttendance = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ success: false, message: "Forbidden" });

    const { startOfDay, endOfDay } = getTodayDateRange();

    const todaysRecords = await prisma.attendance.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay }
      },
      include: {
        student: {
          select: {
            fullName: true,
            user: { select: { mobile: true } }
          }
        }
      },
      orderBy: { checkInTime: 'desc' }
    });

    const activeStudents = todaysRecords.filter(r => r.checkInTime && !r.checkOutTime);
    const completedStudents = todaysRecords.filter(r => r.checkOutTime);

    return res.json({
      success: true,
      data: {
        totalPresent: todaysRecords.length,
        currentlyInside: activeStudents.length,
        completed: completedStudents.length,
        records: todaysRecords
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAttendanceFilters = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ success: false, message: "Forbidden" });

    // Expects query params like ?date=YYYY-MM-DD or ?studentId=123
    const { date, studentId } = req.query;

    const query: any = {};
    if (studentId) {
      query.studentId = Number(studentId);
    }
    if (date) {
      const targetDate = new Date(date as string);
      targetDate.setHours(0,0,0,0);
      const startOfDay = targetDate;
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23,59,59,999);
      query.date = { gte: startOfDay, lte: endOfDay };
    }

    const records = await prisma.attendance.findMany({
      where: query,
      include: {
        student: {
          select: { fullName: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    return res.json({ success: true, data: records });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAttendanceTrends = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ success: false, message: "Forbidden" });

    const trends = [];
    const now = new Date();

    // Loop through the last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const start = d;
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const count = await prisma.attendance.count({
        where: {
          date: { gte: start, lte: end }
        }
      });

      trends.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      });
    }

    return res.json({ success: true, data: trends });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Trend analysis failure" });
  }
};

export const forceCheckout = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ success: false, message: "Forbidden" });

    const { attendanceId, checkOutTime } = req.body;

    if (!attendanceId) {
      return res.status(400).json({ success: false, message: "Attendance ID is required" });
    }

    const record = await prisma.attendance.findUnique({
      where: { id: Number(attendanceId) }
    });

    if (!record) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    if (record.checkOutTime) {
      return res.status(400).json({ success: false, message: "Student already checked out" });
    }

    const manualTime = checkOutTime ? new Date(checkOutTime) : new Date();
    
    // Validation: Cannot checkout before checkin
    if (record.checkInTime && manualTime < new Date(record.checkInTime)) {
      return res.status(400).json({ 
        success: false, 
        message: "Check-out time cannot be earlier than check-in time" 
      });
    }

    // Validation: Cannot checkout in the future
    if (manualTime > new Date()) {
      return res.status(400).json({ success: false, message: "Cannot record checkout in the future" });
    }

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOutTime: manualTime
      }
    });

    return res.json({ 
      success: true, 
      message: "Manual checkout successful",
      data: updated
    });

  } catch (error) {
    console.error("Force Checkout Error:", error);
    return res.status(500).json({ success: false, message: "Server error occurred during rescue" });
  }
};
