import { prisma } from "../db/prisma.js";
import { getTodayDateRange } from "../utils/time.js";
export const getLiveAttendance = async (req, res) => {
    try {
        if (req.user?.role !== "admin")
            return res.status(403).json({ success: false, message: "Forbidden" });
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
export const getAttendanceFilters = async (req, res) => {
    try {
        if (req.user?.role !== "admin")
            return res.status(403).json({ success: false, message: "Forbidden" });
        // Expects query params like ?date=YYYY-MM-DD or ?studentId=123
        const { date, studentId } = req.query;
        const query = {};
        if (studentId) {
            query.studentId = Number(studentId);
        }
        if (date) {
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            const startOfDay = targetDate;
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
//# sourceMappingURL=admin-dashboard.controller.js.map