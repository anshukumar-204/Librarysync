/**
 * Logic to calculate student fee status for UI display.
 * Matches backend "after 15th" logic.
 */
export const calculateFeeStatus = (student) => {
    if (!student || !student.joinDate) return { label: 'Unknown', color: 'zinc' };

    const joinDate = new Date(student.joinDate);
    const today = new Date();
    const monthlyFee = student.monthlyFee || 500;
    const cycleDay = joinDate.getDate();

    // Find the current cycle month/year
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Aggregate payments for the current billing cycle
    const currentPayments = (student.feePayments || []).filter(p => 
        p.month === currentMonth && p.year === currentYear
    );
    const totalPaid = currentPayments.reduce((sum, p) => sum + p.amount, 0);

    // After cycle day check:
    const isPastCycleDay = today.getDate() > cycleDay;

    if (totalPaid >= monthlyFee) {
        return { label: 'Paid', color: 'emerald' };
    }

    if (isPastCycleDay) {
        return { label: totalPaid > 0 ? 'Partial' : 'Pending', color: 'rose' };
    }

    return { label: totalPaid > 0 ? 'Partial' : 'Current', color: 'blue' };
};
