/**
 * Helper to get START and END of the day for DB queries
 */
export declare const getTodayDateRange: () => {
    startOfDay: Date;
    endOfDay: Date;
};
/**
 * Calculates study hours from CheckIn and CheckOut
 * Returns float hours (e.g., 2.5 for 2 hours 30 mins)
 */
export declare const calculateStudyHours: (checkIn: Date, checkOut: Date | null) => number;
export declare const getMidnightDate: (date: Date) => Date;
//# sourceMappingURL=time.d.ts.map