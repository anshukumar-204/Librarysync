import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";

/**
 * Helper to calculate fee summary for a single student based on their joinDate and fee payments.
 */
const calculateDetailedSummary = (student: any, payments: any[], monthlyFee: number, today: Date) => {
  const joinDate = new Date(student.joinDate);
  const cycleDay = joinDate.getDate();

  const historicalCycles: any[] = [];
  let currentCycleDate = new Date(joinDate.getFullYear(), joinDate.getMonth(), joinDate.getDate());
  let carryForward = 0;

  // Iterate through all months from joining until current month OR as long as carryForward exists
  while (
    currentCycleDate <= today || 
    (currentCycleDate.getMonth() === today.getMonth() && currentCycleDate.getFullYear() === today.getFullYear()) ||
    carryForward > 0
  ) {
    const monthLabel = currentCycleDate.getMonth() + 1;
    const yearLabel = currentCycleDate.getFullYear();
    
    const intrinsicPayments = payments.filter(p => p.month === monthLabel && p.year === yearLabel);
    const intrinsicTotal = intrinsicPayments.reduce((sum, p) => sum + p.amount, 0);
    
    const effectiveFunds = intrinsicTotal + carryForward;
    
    let status: 'PAID' | 'PARTIAL' | 'PENDING' = "PENDING";
    if (effectiveFunds >= monthlyFee) status = "PAID";
    else if (effectiveFunds > 0) status = "PARTIAL";

    // Calculate carry forward for the next cycle
    const surplus = Math.max(0, effectiveFunds - monthlyFee);
    
    const isPastCycleDay = today.getDate() > cycleDay;
    const isPastMonth = (today.getFullYear() > yearLabel) || (today.getFullYear() === yearLabel && today.getMonth() + 1 > monthLabel);
    const isCurrentMonth = today.getMonth() + 1 === monthLabel && today.getFullYear() === yearLabel;
    const isFuture = (today.getFullYear() < yearLabel) || (today.getFullYear() === yearLabel && today.getMonth() + 1 < monthLabel);
    
    // Notifications only for past/current overdue, not future
    const shouldNotify = !isFuture && status !== "PAID" && (isPastMonth || (isCurrentMonth && isPastCycleDay));

    historicalCycles.push({
      month: monthLabel,
      year: yearLabel,
      expected: monthlyFee,
      paid: effectiveFunds, 
      balance: isFuture ? 0 : Math.max(0, monthlyFee - effectiveFunds), // Future months don't have "due" balance yet unless we want to show it
      status: (isFuture && status === 'PAID') ? 'PAID' : status,
      isCredit: isFuture && status === 'PAID',
      cycleDate: new Date(yearLabel, monthLabel - 1, cycleDay),
      isOverdue: shouldNotify,
      payments: intrinsicPayments
    });

    carryForward = surplus; 
    currentCycleDate = new Date(currentCycleDate.getFullYear(), currentCycleDate.getMonth() + 1, cycleDay);
    
    // Safety break and stop if we are way in the future and out of credit
    if (historicalCycles.length > 240 || (isFuture && carryForward <= 0)) break; 
  }

  return historicalCycles;
};

export const getStudentFeeSummary = async (req: Request, res: Response) => {
  try {
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;
    const { studentId } = req.params;

    let targetStudentId: number;

    if (requesterRole === 'admin') {
      if (!studentId) return res.status(400).json({ success: false, message: "Student ID required for admin lookup" });
      targetStudentId = Number(studentId);
    } else {
      const studentProfile = await prisma.student.findUnique({ where: { userId: requesterId } });
      if (!studentProfile) return res.status(404).json({ success: false, message: "Student profile not found" });
      targetStudentId = studentProfile.id;
    }

    const student = await prisma.student.findUnique({
      where: { id: targetStudentId },
      include: { 
        feePayments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found" });
    }

    const historicalCycles = calculateDetailedSummary(student, student.feePayments, student.monthlyFee, new Date());
    const sortedPayments = [...student.feePayments].sort((a,b) => b.paymentDate.getTime() - a.paymentDate.getTime());
    const lastP = sortedPayments[0];

    return res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          fullName: student.fullName,
          joinDate: student.joinDate,
          monthlyFee: student.monthlyFee
        },
        summary: {
          totalCycles: historicalCycles.length,
          totalPaid: student.feePayments.reduce((sum, p) => sum + p.amount, 0),
          totalPending: historicalCycles.reduce((sum, c) => sum + c.balance, 0),
          isDefaulter: historicalCycles.some(c => c.isOverdue),
          lastPaymentDetails: lastP ? {
            amount: lastP.amount,
            date: lastP.paymentDate,
            month: lastP.month,
            year: lastP.year
          } : null
        },
        history: historicalCycles.reverse(),
        payments: student.feePayments // Detailed payment journal
      }
    });

  } catch (error) {
    console.error("FEE ANALYTICS ERROR:", error);
    return res.status(500).json({ success: false, message: "Financial vault access error" });
  }
};

/**
 * Returns a high-level fee registry for all students.
 * Admin only.
 */
export const getFeesRegistry = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ success: false, message: "Forbidden" });

    const students = await prisma.student.findMany({
      include: { 
        feePayments: true,
        user: { select: { mobile: true, status: true } }
      }
    });

    const today = new Date();
    const registry = students.map(student => {
      const cycles = calculateDetailedSummary(student, student.feePayments, student.monthlyFee, today);
      const totalPaid = student.feePayments.reduce((sum, p) => sum + p.amount, 0);
      const totalPending = cycles.reduce((sum, c) => sum + c.balance, 0);
      
      const sortedPayments = [...student.feePayments].sort((a,b) => b.paymentDate.getTime() - a.paymentDate.getTime());
      const lastP = sortedPayments[0];

      return {
        id: student.id,
        fullName: student.fullName,
        mobile: student.user.mobile,
        status: student.user.status,
        monthlyFee: student.monthlyFee,
        totalPaid,
        totalPending,
        isDefaulter: cycles.some(c => c.isOverdue),
        lastPaymentDetails: lastP ? {
          amount: lastP.amount,
          date: lastP.paymentDate,
          month: lastP.month,
          year: lastP.year
        } : null
      };
    });

    // Calculate Global Monthly Stats for Registry
    const allPayments = students.flatMap(s => s.feePayments);
    const monthlyStatsMap: Record<string, number> = {};
    allPayments.forEach(p => {
      const key = `${p.month}-${p.year}`;
      monthlyStatsMap[key] = (monthlyStatsMap[key] || 0) + p.amount;
    });

    // Convert map to a sorted array (recent months first)
    const monthlyStats = Object.entries(monthlyStatsMap).map(([key, amount]) => {
      const [m, y] = key.split('-');
      return { month: Number(m), year: Number(y), amount };
    }).sort((a,b) => b.year !== a.year ? b.year - a.year : b.month - a.month);

    return res.json({
      success: true,
      data: {
        registry,
        stats: {
          monthlyStats
        }
      }
    });

  } catch (error) {
    console.error("FEES REGISTRY ERROR:", error);
    return res.status(500).json({ success: false, message: "Internal financial registry error" });
  }
};

/**
 * Records a payment for a student. Supports partial and full payments.
 * Restricted to Admin.
 */
export const recordFeePayment = async (req: Request, res: Response) => {
  try {
    const { studentId, month, year, amount, remarks } = req.body;

    if (!studentId || !month || !year || !amount) {
      return res.status(400).json({ success: false, message: "Incomplete payment telemetry provided." });
    }

    // Record the payment
    const payment = await prisma.feePayment.create({
      data: {
        studentId: Number(studentId),
        month: Number(month),
        year: Number(year),
        amount: Number(amount),
        remarks: remarks || "Monthly library subscription"
      }
    });

    return res.status(201).json({ 
      success: true, 
      message: "Payment synchronized to registry.", 
      data: payment 
    });

  } catch (error) {
    console.error("PAYMENT REGISTRY ERROR:", error);
    return res.status(500).json({ success: false, message: "Registry update failure" });
  }
};

/**
 * Allows Admin to update a student's default monthly fee.
 */
export const updateStudentMonthlyFee = async (req: Request, res: Response) => {
  try {
    const { studentId, fee } = req.body;
    if (!studentId || fee === undefined) return res.status(400).json({ success: false, message: "Parameter mismatch" });

    await prisma.student.update({
      where: { id: Number(studentId) },
      data: { monthlyFee: Number(fee) }
    });

    return res.json({ success: true, message: "Student tariff updated successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Registry modification failure" });
  }
};
