import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";

/**
 * Calculates a summary of monthly fee cycles for a student,
 * determining Paid, Partial, or Overdue status by comparing
 * joinDate cycles against FeePayment records.
 */
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
      // Student is requesting their own status
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

    const joinDate = new Date(student.joinDate);
    const today = new Date();
    const monthlyFee = student.monthlyFee;
    const cycleDay = joinDate.getDate();

    const historicalCycles: any[] = [];
    let currentCycleDate = new Date(joinDate.getFullYear(), joinDate.getMonth(), joinDate.getDate());

    // Iterate through all months from joining until the current month to build the ledger
    while (currentCycleDate <= today || (currentCycleDate.getMonth() === today.getMonth() && currentCycleDate.getFullYear() === today.getFullYear())) {
      const monthLabel = currentCycleDate.getMonth() + 1;
      const yearLabel = currentCycleDate.getFullYear();
      
      const paymentsForCycle = student.feePayments.filter(p => p.month === monthLabel && p.year === yearLabel);
      const totalPaid = paymentsForCycle.reduce((sum, p) => sum + p.amount, 0);
      
      let status: 'PAID' | 'PARTIAL' | 'PENDING' = "PENDING";
      if (totalPaid >= monthlyFee) status = "PAID";
      else if (totalPaid > 0) status = "PARTIAL";

      // Strict Due Logic: Notification appears AFTER the cycle day of the current month
      const isPastCycleDay = today.getDate() > cycleDay;
      const isPastMonth = (today.getFullYear() > yearLabel) || (today.getFullYear() === yearLabel && today.getMonth() + 1 > monthLabel);
      
      const isCurrentMonth = today.getMonth() + 1 === monthLabel && today.getFullYear() === yearLabel;
      
      // Notify only if it's a past month OR it's the current month AND we are past the joining day
      const shouldNotify = status !== "PAID" && (isPastMonth || (isCurrentMonth && isPastCycleDay));

      historicalCycles.push({
        month: monthLabel,
        year: yearLabel,
        expected: monthlyFee,
        paid: totalPaid,
        balance: Math.max(0, monthlyFee - totalPaid),
        status,
        cycleDate: new Date(yearLabel, monthLabel - 1, cycleDay),
        isOverdue: shouldNotify,
        payments: paymentsForCycle
      });

      // Increment by 1 month safely
      currentCycleDate = new Date(currentCycleDate.getFullYear(), currentCycleDate.getMonth() + 1, cycleDay);
      
      // Break safety if data is corrupted or joinDate is in future
      if (historicalCycles.length > 240) break; // 20 year cap
    }

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
          isDefaulter: historicalCycles.some(c => c.isOverdue)
        },
        history: historicalCycles.reverse() // Show latest first for UI UX
      }
    });

  } catch (error) {
    console.error("FEE ANALYTICS ERROR:", error);
    return res.status(500).json({ success: false, message: "Financial vault access error" });
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
