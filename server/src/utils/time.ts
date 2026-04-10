/**
 * Helper to get START and END of the day for DB queries
 */
export const getTodayDateRange = () => {
  const now = new Date();
  
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  
  return { startOfDay, endOfDay };
};

/**
 * Calculates study hours from CheckIn and CheckOut
 * Returns float hours (e.g., 2.5 for 2 hours 30 mins)
 */
export const calculateStudyHours = (checkIn: Date, checkOut: Date | null): number => {
  if (!checkOut) return 0;
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return Number(diffHours.toFixed(2));
};

export const getMidnightDate = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};
