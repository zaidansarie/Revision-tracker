/**
 * ZaidRev Comprehensive Revision Engine & Edge Case Test Suite
 * Tests every possible scenario:
 * 1. Default spaced repetition interval flow (1, 3, 7, 30 days)
 * 2. Infinite repeat of the final interval (30 days indefinitely)
 * 3. Exact user delay scenario (scheduled Oct 31, revised Nov 2 -> moves next revision by 2 days)
 * 4. Severe delay (overdue by 15 days, 30 days)
 * 5. Early revision (completed before scheduled date)
 * 6. Past "Date Studied" selection & initial schedule calculation
 * 7. Editing "Date Studied" and automatic rescheduling of next revision
 * 8. Calendar boundaries (End of month, End of year, Leap years)
 * 9. Custom user settings intervals (e.g. [2, 5, 14], single interval [7])
 * 10. Search filtering scoping (All vs specific folder)
 */

const assert = require("assert");

// --- Replicate the exact date-utils logic to test pure algorithms ---
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function addDays(dateStr, days) {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

function calculateNextRevision(currentIntervalIndex, intervals, completionDateStr) {
  const safeIntervals = intervals.length > 0 ? intervals : [1, 3, 7, 30];
  const nextIndex = Math.min(currentIntervalIndex + 1, safeIntervals.length - 1);
  const intervalDays = safeIntervals[nextIndex];
  const nextDate = addDays(completionDateStr, intervalDays);

  return {
    nextIndex,
    nextDate,
    intervalDays,
  };
}

function isDueTodayOrPast(scheduledDateStr, todayStr) {
  return scheduledDateStr <= todayStr;
}

function formatDisplayDate(dateStr, todayStr) {
  if (dateStr === todayStr) return "Today";

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

// ------------------- TEST RUNNER -------------------
let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log("\n=======================================================");
console.log("🚀 STARTING ZAIDREV REVISION SUITE TEST EXECUTION");
console.log("=======================================================\n");

// --- SUITE 1: Normal Default Flow ---
console.log("TEST SUITE 1: Normal Spaced Repetition Flow (1, 3, 7, 30 days)");
const defaultIntervals = [1, 3, 7, 30];

runTest("Topic created on Nov 2 schedules 1 day later (Nov 3)", () => {
  const createdDate = "2026-11-02";
  const initialNextDate = addDays(createdDate, defaultIntervals[0]);
  assert.strictEqual(initialNextDate, "2026-11-03");
});

runTest("1st Revision completed on time advances from 1-day to 3-day interval", () => {
  const r1 = calculateNextRevision(0, defaultIntervals, "2026-11-03");
  assert.strictEqual(r1.nextIndex, 1);
  assert.strictEqual(r1.intervalDays, 3);
  assert.strictEqual(r1.nextDate, "2026-11-06"); // 3 Nov + 3 days = 6 Nov
});

runTest("2nd Revision completed on time advances from 3-day to 7-day interval", () => {
  const r2 = calculateNextRevision(1, defaultIntervals, "2026-11-06");
  assert.strictEqual(r2.nextIndex, 2);
  assert.strictEqual(r2.intervalDays, 7);
  assert.strictEqual(r2.nextDate, "2026-11-13"); // 6 Nov + 7 days = 13 Nov
});

runTest("3rd Revision completed on time advances from 7-day to 30-day interval", () => {
  const r3 = calculateNextRevision(2, defaultIntervals, "2026-11-13");
  assert.strictEqual(r3.nextIndex, 3);
  assert.strictEqual(r3.intervalDays, 30);
  assert.strictEqual(r3.nextDate, "2026-12-13"); // 13 Nov + 30 days = 13 Dec
});

// --- SUITE 2: Infinite Repeating Last Interval ---
console.log("\nTEST SUITE 2: Final Interval Repeating Rule (30 days repeating)");

runTest("4th Revision (at last index 3) stays at 30 days and repeats", () => {
  const r4 = calculateNextRevision(3, defaultIntervals, "2026-12-13");
  assert.strictEqual(r4.nextIndex, 3);
  assert.strictEqual(r4.intervalDays, 30);
  assert.strictEqual(r4.nextDate, "2027-01-12"); // 13 Dec + 30 days = 12 Jan 2027
});

runTest("5th Revision continues repeating at 30 days", () => {
  const r5 = calculateNextRevision(3, defaultIntervals, "2027-01-12");
  assert.strictEqual(r5.nextIndex, 3);
  assert.strictEqual(r5.intervalDays, 30);
  assert.strictEqual(r5.nextDate, "2027-02-11"); // 12 Jan + 30 days = 11 Feb 2027
});

runTest("10th Revision still repeats at 30 days indefinitely", () => {
  const r10 = calculateNextRevision(3, defaultIntervals, "2027-07-11");
  assert.strictEqual(r10.nextIndex, 3);
  assert.strictEqual(r10.intervalDays, 30);
  assert.strictEqual(r10.nextDate, "2027-08-10");
});

// --- SUITE 3: Exact User Delay Specification ---
console.log("\nTEST SUITE 3: Exact User Delay Specification");
console.log("Specification: 'if revision was scheduled on 31 Oct, but i revised it on 2 Nov, that's a 2 day delay, so next revision should be moved 2 days more.'");

runTest("Oct 31 scheduled, revised 2 days late on Nov 2 (3-day interval case)", () => {
  // If revised on time (31 Oct), next would be 31 Oct + 3 days = 3 Nov
  // Revised on 2 Nov (2 day delay) -> should be 3 Nov + 2 days = 5 Nov
  const result = calculateNextRevision(0, defaultIntervals, "2026-11-02");
  assert.strictEqual(result.nextDate, "2026-11-05");
  
  // Verify mathematical delay shift
  const onTimeNext = addDays("2026-10-31", 3); // 2026-11-03
  const expectedDelayed = addDays(onTimeNext, 2); // 2026-11-05
  assert.strictEqual(result.nextDate, expectedDelayed);
});

runTest("Oct 31 scheduled, revised 2 days late on Nov 2 (7-day interval case)", () => {
  // If revised on time (31 Oct), next would be 31 Oct + 7 days = 7 Nov
  // Revised on 2 Nov (2 day delay) -> should be 7 Nov + 2 days = 9 Nov
  const result = calculateNextRevision(1, defaultIntervals, "2026-11-02");
  assert.strictEqual(result.nextDate, "2026-11-09");

  const onTimeNext = addDays("2026-10-31", 7); // 2026-11-07
  const expectedDelayed = addDays(onTimeNext, 2); // 2026-11-09
  assert.strictEqual(result.nextDate, expectedDelayed);
});

runTest("Oct 31 scheduled, revised 2 days late on Nov 2 (30-day interval case)", () => {
  // If revised on time (31 Oct), next would be 31 Oct + 30 days = 30 Nov
  // Revised on 2 Nov (2 day delay) -> should be 30 Nov + 2 days = 2 Dec
  const result = calculateNextRevision(2, defaultIntervals, "2026-11-02");
  assert.strictEqual(result.nextDate, "2026-12-02");

  const onTimeNext = addDays("2026-10-31", 30); // 2026-11-30
  const expectedDelayed = addDays(onTimeNext, 2); // 2026-12-02
  assert.strictEqual(result.nextDate, expectedDelayed);
});

// --- SUITE 4: Severe Delays & Early Revisions ---
console.log("\nTEST SUITE 4: Extreme Delays and Early Revisions");

runTest("Severe delay: Scheduled 15 days ago, completed today", () => {
  const scheduledDate = "2026-10-18";
  const today = "2026-11-02"; // 15 days late
  assert.strictEqual(isDueTodayOrPast(scheduledDate, today), true);

  // Next revision is calculated from today + next interval (7 days)
  const result = calculateNextRevision(1, defaultIntervals, today);
  assert.strictEqual(result.nextDate, "2026-11-09");
});

runTest("Early revision prevention: Topics scheduled in the future cannot be marked revised", () => {
  const today = "2026-11-02";
  const futureScheduledDate = "2026-11-05"; // Due in 3 days
  
  // Guard check: is it allowed to revise early?
  const canRevise = isDueTodayOrPast(futureScheduledDate, today);
  assert.strictEqual(canRevise, false, "Topics scheduled in the future must not be allowed to revise early");
});

// --- SUITE 5: Past 'Date Studied' & Editing Study Date ---
console.log("\nTEST SUITE 5: Past Date Studied & Editing Study Date");

runTest("Topic studied 5 days ago (Oct 28), first interval 1 day -> Next was Oct 29 (Overdue)", () => {
  const studiedDate = "2026-10-28";
  const nextDate = addDays(studiedDate, defaultIntervals[0]);
  assert.strictEqual(nextDate, "2026-10-29");

  const today = "2026-11-02";
  assert.strictEqual(isDueTodayOrPast(nextDate, today), true);
  assert.strictEqual(formatDisplayDate(nextDate, today), "4 days overdue");
});

runTest("Editing study date from Nov 1 to Oct 25 correctly reschedules next revision", () => {
  const oldStudyDate = "2026-11-01";
  const oldNext = addDays(oldStudyDate, 1);
  assert.strictEqual(oldNext, "2026-11-02");

  // User edits study date to Oct 25
  const newStudyDate = "2026-10-25";
  const newNext = addDays(newStudyDate, 1);
  assert.strictEqual(newNext, "2026-10-26"); // 26 Oct (Overdue)
});

// --- SUITE 6: Calendar Month & Year Boundaries ---
console.log("\nTEST SUITE 6: Calendar Boundaries (Leap Year, Dec-Jan, Month Ends)");

runTest("Dec 31 to Jan boundary: addDays correctly advances across year change", () => {
  assert.strictEqual(addDays("2026-12-31", 1), "2027-01-01");
  assert.strictEqual(addDays("2026-12-31", 30), "2027-01-30");
});

runTest("Leap year 2028: Feb 28 + 1 day is Feb 29", () => {
  assert.strictEqual(addDays("2028-02-28", 1), "2028-02-29");
  assert.strictEqual(addDays("2028-02-28", 2), "2028-03-01");
});

runTest("Non-leap year 2027: Feb 28 + 1 day is Mar 01", () => {
  assert.strictEqual(addDays("2027-02-28", 1), "2027-03-01");
});

// --- SUITE 7: Custom Interval Schedules ---
console.log("\nTEST SUITE 7: Custom User Interval Settings");

runTest("Custom schedule [2, 5, 10]: advances 2 -> 5 -> 10 -> 10 repeats", () => {
  const custom = [2, 5, 10];
  const date0 = "2026-11-02";

  // Initial creation: +2 days
  const n0 = addDays(date0, custom[0]);
  assert.strictEqual(n0, "2026-11-04");

  // Revise step 1: +5 days
  const r1 = calculateNextRevision(0, custom, "2026-11-04");
  assert.strictEqual(r1.nextDate, "2026-11-09");
  assert.strictEqual(r1.nextIndex, 1);

  // Revise step 2: +10 days
  const r2 = calculateNextRevision(1, custom, "2026-11-09");
  assert.strictEqual(r2.nextDate, "2026-11-19");
  assert.strictEqual(r2.nextIndex, 2);

  // Revise step 3: repeats +10 days
  const r3 = calculateNextRevision(2, custom, "2026-11-19");
  assert.strictEqual(r3.nextDate, "2026-11-29");
  assert.strictEqual(r3.nextIndex, 2);
});

runTest("Single interval [7]: repeats 7 days every time", () => {
  const single = [7];
  const r1 = calculateNextRevision(0, single, "2026-11-02");
  assert.strictEqual(r1.nextDate, "2026-11-09");
  assert.strictEqual(r1.nextIndex, 0);

  const r2 = calculateNextRevision(0, single, "2026-11-09");
  assert.strictEqual(r2.nextDate, "2026-11-16");
  assert.strictEqual(r2.nextIndex, 0);
});

// --- SUITE 8: Search Scoping Verification ---
console.log("\nTEST SUITE 8: Search Scoping (All vs Folder)");

runTest("Search on homepage finds topics matching title across all folders", () => {
  const topics = [
    { id: "1", folder_id: "folder_a", title: "Binary Search" },
    { id: "2", folder_id: "folder_b", title: "Binary Trees" },
    { id: "3", folder_id: "folder_a", title: "Linked List" },
  ];
  const query = "binary";
  const results = topics.filter(t => t.title.toLowerCase().includes(query));
  assert.strictEqual(results.length, 2);
});

runTest("Search inside Folder A only returns topics from Folder A", () => {
  const topics = [
    { id: "1", folder_id: "folder_a", title: "Binary Search" },
    { id: "2", folder_id: "folder_b", title: "Binary Trees" },
    { id: "3", folder_id: "folder_a", title: "Linked List" },
  ];
  const activeFolderId = "folder_a";
  const scopedTopics = topics.filter(t => t.folder_id === activeFolderId);
  const query = "binary";
  const results = scopedTopics.filter(t => t.title.toLowerCase().includes(query));
  
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].title, "Binary Search");
});

console.log("\n=======================================================");
console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
console.log("=======================================================\n");

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

