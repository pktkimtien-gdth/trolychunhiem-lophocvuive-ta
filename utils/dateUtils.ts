/**
 * Utility functions for Vietnamese Academic Calendar calculations
 * Computes Academic Year (Năm học) and Academic Week (Tuần học) according to Ministry of Education guidelines.
 */

export interface AcademicYearInfo {
  currentWeek: number;
  academicYear: string;
  formattedString: string;
  weekLabel: string;
  semester: 'Học kỳ I' | 'Học kỳ II';
  schoolYearStart: Date;
}

/**
 * Calculates current academic year and week number from a given date (defaults to current system date).
 * Vietnamese school calendar officially begins on September 5th.
 *
 * - Academic Year: If current date is >= Sept 5, Year is YYYY - (YYYY + 1). If earlier, (YYYY - 1) - YYYY.
 * - Current Week: Number of full weeks passed since September 5th (Week 1 begins on Sept 5th).
 */
export function getAcademicYearInfo(targetDate: Date = new Date()): AcademicYearInfo {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth(); // 0-indexed (8 = September)
  const date = targetDate.getDate();

  // Determine starting calendar year of current school year
  // School year starts on September 5th
  const isAfterSchoolStart = month > 8 || (month === 8 && date >= 5);
  const startYear = isAfterSchoolStart ? year : year - 1;
  const endYear = startYear + 1;
  const academicYear = `${startYear} - ${endYear}`;

  // Official school start date: September 5th at 00:00:00
  const schoolYearStart = new Date(startYear, 8, 5, 0, 0, 0, 0);

  // Calculate elapsed days
  const diffMs = targetDate.getTime() - schoolYearStart.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Week 1 starts on Sept 5th.
  // Each full 7 days elapsed advances by 1 week.
  let weekNum = 1;
  if (diffDays >= 0) {
    weekNum = Math.floor(diffDays / 7) + 1;
  }

  // Elementary school standard curriculum spans 35 weeks (18 weeks Sem 1, 17 weeks Sem 2)
  const currentWeek = Math.max(1, Math.min(35, weekNum));
  const weekLabel = `Tuần ${currentWeek}`;
  const formattedString = `${weekLabel} (Hiện tại)`;
  const semester: 'Học kỳ I' | 'Học kỳ II' = currentWeek <= 18 ? 'Học kỳ I' : 'Học kỳ II';

  return {
    currentWeek,
    academicYear,
    formattedString,
    weekLabel,
    semester,
    schoolYearStart,
  };
}

/**
 * Extracts unique week names from a list of class tasks, merges with standard/current weeks,
 * and sorts them naturally.
 */
export function extractUniqueWeeks(tasks: Array<{ week?: string }>, currentWeekLabel?: string): string[] {
  const weekSet = new Set<string>();

  // Always include the current calculated week if provided
  if (currentWeekLabel) {
    weekSet.add(currentWeekLabel);
  }

  // Extract from existing tasks
  tasks.forEach((t) => {
    if (t.week && t.week.trim()) {
      weekSet.add(t.week.trim());
    }
  });

  // Always ensure recent relevant weeks exist
  const currentInfo = getAcademicYearInfo();
  weekSet.add(currentInfo.weekLabel);

  // Convert to array and sort with natural week number order (higher weeks first or logical order)
  const weeksArray = Array.from(weekSet);

  return weeksArray.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    // Higher week number first (descending chronological order)
    return numB - numA;
  });
}

/**
 * Returns standard list of academic weeks ('Tuần 1' through 'Tuần 35')
 */
export function getStandardAcademicWeeksList(maxWeeks = 35): string[] {
  const weeks: string[] = [];
  for (let i = 1; i <= maxWeeks; i++) {
    weeks.push(`Tuần ${i}`);
  }
  return weeks;
}
