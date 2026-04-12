import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { calculateStudyHours, getTodayDateRange } from "../utils/time.js";

export const getTodayStatus = async (req: Request, res: Response) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    if (!student) return res.status(404).json({ success: false, message: "Not a student" });

    const { startOfDay, endOfDay } = getTodayDateRange();

    const todayRecord = await prisma.attendance.findFirst({
      where: {
        studentId: student.id,
        date: { gte: startOfDay, lte: endOfDay }
      }
    });

    if (!todayRecord) {
      return res.json({ success: true, status: "Absent", checkIn: null, checkOut: null, studyHours: 0 });
    }

    const currentStatus = todayRecord.checkOutTime ? "Completed" : "In Library";
    // If they are in library, calculate ongoing hours dynamically
    const studyHours = calculateStudyHours(todayRecord.checkInTime!, todayRecord.checkOutTime || new Date());

    return res.json({
      success: true,
      status: currentStatus,
      checkIn: todayRecord.checkInTime,
      checkOut: todayRecord.checkOutTime,
      studyHours
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 30;
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    if (!student) return res.status(404).json({ success: false, message: "Not a student" });

    const history = await prisma.attendance.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' },
      take: Math.min(limit, 365) // Get up to 365 entries
    });

    // Map the output to calculate study hours per individual record
    const mappedHistory = history.map(record => ({
      id: record.id,
      date: record.date,
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime,
      studyHours: calculateStudyHours(record.checkInTime!, record.checkOutTime)
    }));

    return res.json({ success: true, data: mappedHistory });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getConsistencyMetrics = async (req: Request, res: Response) => {
  try {
    const student = await prisma.student.findUnique({ 
      where: { userId: req.user!.id },
      include: { user: { select: { email: true, mobile: true } } }
    });
    if (!student) return res.status(404).json({ success: false, message: "Not a student" });

    // Fetch all history chronologically
    const history = await prisma.attendance.findMany({
      where: { studentId: student.id, checkOutTime: { not: null } },
      orderBy: { date: 'desc' }
    });

    let totalStudyHours = 0;
    history.forEach(r => totalStudyHours += calculateStudyHours(r.checkInTime!, r.checkOutTime));

    const totalDaysAttended = history.length;
    
    // Streak logic implementation
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    let checkDate = new Date(today);

    // Start streak calculation
    for (const record of history) {
      const recordDate = new Date(record.date);
      recordDate.setHours(0,0,0,0);

      // If the record happened today, count it and go to yesterday
      if (recordDate.getTime() === checkDate.getTime()) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (recordDate.getTime() < checkDate.getTime()) {
        // Gap detected! Stop streak. (Unless today has no record yet, handled by checkDate logic above)
        // Actually, if today is missed but they were present yesterday, we must allow the 1 day grace.
        // Let's refine:
        if (currentStreak === 0 && (checkDate.getTime() - recordDate.getTime() === 86400000)) {
           currentStreak++;
           checkDate = new Date(recordDate);
           checkDate.setDate(checkDate.getDate() - 1);
        } else {
           break;
        }
      }
    }

    return res.json({
      success: true,
      data: {
        totalDaysAttended,
        totalStudyHours: Number(totalStudyHours.toFixed(2)),
        currentStreak,
        student: {
          id: student.id,
          fullName: student.fullName,
          fatherName: student.fatherName,
          profileImage: student.profileImage,
          address: student.address,
          village: student.village,
          post: student.post,
          district: student.district,
          city: student.city,
          state: student.state,
          pincode: student.pincode,
          bio: student.bio,
          email: student.user?.email,
          mobile: student.user?.mobile
        }
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
