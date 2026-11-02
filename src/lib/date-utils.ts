/**
 * Utility functions for date calculations, spaced repetition intervals,
 * and delay shifting according to ZaidRev specifications.
 */

// Formats a Date object to YYYY-MM-DD in the local timezone
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Gets today's local date in YYYY-MM-DD
export function getTodayDateString(): string {
  return formatLocalDate(new Date());
}

// Parses YYYY-MM-DD into a local Date object (ignoring UTC timezone offsets)
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // midday avoids DST shift
}

// Adds a number of days to a YYYY-MM-DD date string
export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

// Calculates the next revision date and interval index
// Rules:
// 1. Next revision date = completionDate + intervals[nextIndex]
//    (If revision was scheduled on 31 Oct but done on 2 Nov, that's a 2 day delay;
//     calculating from the actual revision completion date shifts future revisions by the delay).
// 2. The last interval repeats indefinitely.
export function calculateNextRevision(
  currentIntervalIndex: number,
  intervals: number[],
  completionDateStr: string = getTodayDateString()
): { nextIndex: number; nextDate: string; intervalDays: number } {
  const safeIntervals = intervals.length > 0 ? intervals : [1, 3, 7, 30];
  
  // Advance index, but cap at the last interval index so it repeats
  const nextIndex = Math.min(
    currentIntervalIndex + 1,
    safeIntervals.length - 1
  );
  
  const intervalDays = safeIntervals[nextIndex];
  const nextDate = addDays(completionDateStr, intervalDays);

  return {
    nextIndex,
    nextDate,
    intervalDays,
  };
}

// Checks if a revision is due today or overdue
export function isDueTodayOrPast(scheduledDateStr: string, todayStr: string = getTodayDateString()): boolean {
  return scheduledDateStr <= todayStr;
}

// Returns a human-friendly label for the date
export function formatDisplayDate(dateStr: string, todayStr: string = getTodayDateString()): string {
  if (dateStr === todayStr) {
    return "Today";
  }

  const d = parseLocalDate(dateStr);
  const t = parseLocalDate(todayStr);
  const diffTime = d.getTime() - t.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === -1) return "Yesterday (Overdue)";
  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== t.getFullYear() ? "numeric" : undefined,
  });
}
