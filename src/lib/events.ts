export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  color: "green" | "blue" | "orange" | "red" | "purple" | "gray";
  allDay?: boolean;
}

// Get today's date info
function getDateStr(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

// Get the date for a specific day of the CURRENT week (0=Sun, 1=Mon, ..., 6=Sat)
function getThisWeekday(dayOfWeek: number): string {
  const d = new Date();
  const currentDay = d.getDay(); // 0=Sun
  const diff = dayOfWeek - currentDay;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

// GT Spring 2026 schedule + personal events
// Classes: CS 3511 B (MW 12:30-1:45), CS 4476 A (MW 2:00-3:15), CS 4510 B (TR 12:30-1:45)
export const sampleEvents: CalendarEvent[] = [
  // ===== MONDAY =====
  { id: "w1", title: "Morning Workout — Push Day", date: getThisWeekday(1), startTime: "06:00", endTime: "07:15", color: "blue" },
  { id: "m1", title: "Breakfast", date: getThisWeekday(1), startTime: "07:30", endTime: "08:00", color: "orange" },
  { id: "c1", title: "CS 3511 B — Algorithms Honors", date: getThisWeekday(1), startTime: "12:30", endTime: "13:45", color: "green" },
  { id: "c2", title: "CS 4476 A — Intro to Computer Vision", date: getThisWeekday(1), startTime: "14:00", endTime: "15:15", color: "green" },
  { id: "s1", title: "Study — Algorithms Problem Set", date: getThisWeekday(1), startTime: "16:00", endTime: "18:00", color: "gray" },
  { id: "m3", title: "Dinner", date: getThisWeekday(1), startTime: "18:30", endTime: "19:15", color: "orange" },

  // ===== TUESDAY =====
  { id: "w2", title: "Morning Workout — Pull Day", date: getThisWeekday(2), startTime: "06:00", endTime: "07:15", color: "blue" },
  { id: "m4", title: "Breakfast", date: getThisWeekday(2), startTime: "07:30", endTime: "08:00", color: "orange" },
  { id: "c3", title: "CS 4510 B — Automata and Complexity", date: getThisWeekday(2), startTime: "12:30", endTime: "13:45", color: "green" },
  { id: "c4", title: "CS 4472 A — Design of Online Communities", date: getThisWeekday(2), startTime: "15:30", endTime: "16:45", color: "green" },
  { id: "m6", title: "Dinner", date: getThisWeekday(2), startTime: "18:30", endTime: "19:15", color: "orange" },
  { id: "p1", title: "David Bible Study", date: getThisWeekday(2), startTime: "19:30", endTime: "21:00", color: "purple" },

  // ===== WEDNESDAY =====
  { id: "w3", title: "Morning Workout — Leg Day", date: getThisWeekday(3), startTime: "06:00", endTime: "07:15", color: "blue" },
  { id: "m7", title: "Breakfast", date: getThisWeekday(3), startTime: "07:30", endTime: "08:00", color: "orange" },
  { id: "c5", title: "CS 3511 B — Algorithms Honors", date: getThisWeekday(3), startTime: "12:30", endTime: "13:45", color: "green" },
  { id: "c6", title: "CS 4476 A — Intro to Computer Vision", date: getThisWeekday(3), startTime: "14:00", endTime: "15:15", color: "green" },
  { id: "s3", title: "Study — Computer Vision Project", date: getThisWeekday(3), startTime: "16:00", endTime: "18:00", color: "gray" },
  { id: "m9", title: "Dinner", date: getThisWeekday(3), startTime: "18:30", endTime: "19:15", color: "orange" },

  // ===== THURSDAY =====
  { id: "w4", title: "Morning Workout — Push Day", date: getThisWeekday(4), startTime: "06:00", endTime: "07:15", color: "blue" },
  { id: "m10", title: "Breakfast", date: getThisWeekday(4), startTime: "07:30", endTime: "08:00", color: "orange" },
  { id: "c7", title: "CS 4510 B — Automata and Complexity", date: getThisWeekday(4), startTime: "12:30", endTime: "13:45", color: "green" },
  { id: "c8", title: "CS 4472 A — Design of Online Communities", date: getThisWeekday(4), startTime: "15:30", endTime: "16:45", color: "green" },
  { id: "m12", title: "Dinner", date: getThisWeekday(4), startTime: "18:30", endTime: "19:15", color: "orange" },

  // ===== FRIDAY =====
  { id: "w5", title: "Morning Workout — Pull Day", date: getThisWeekday(5), startTime: "06:00", endTime: "07:15", color: "blue" },
  { id: "m13", title: "Breakfast", date: getThisWeekday(5), startTime: "07:30", endTime: "08:00", color: "orange" },
  { id: "s5", title: "Office Hours — Prof. Hays (CV)", date: getThisWeekday(5), startTime: "11:00", endTime: "12:00", color: "gray" },
  { id: "m14", title: "Lunch", date: getThisWeekday(5), startTime: "12:15", endTime: "13:00", color: "orange" },
  { id: "s6", title: "CS 3600 Study Group", date: getThisWeekday(5), startTime: "14:00", endTime: "16:00", color: "gray" },
  { id: "m15", title: "Dinner", date: getThisWeekday(5), startTime: "18:00", endTime: "18:45", color: "orange" },

  // ===== SATURDAY =====
  { id: "w6", title: "Morning Run — Cardio", date: getThisWeekday(6), startTime: "08:00", endTime: "09:00", color: "blue" },
  { id: "m16", title: "Brunch", date: getThisWeekday(6), startTime: "10:00", endTime: "11:00", color: "orange" },
  { id: "s8", title: "Study — Automata Homework", date: getThisWeekday(6), startTime: "14:00", endTime: "16:00", color: "gray" },
  { id: "m17", title: "Dinner", date: getThisWeekday(6), startTime: "18:00", endTime: "19:00", color: "orange" },

  // ===== SUNDAY =====
  { id: "p3", title: "Church", date: getThisWeekday(0), startTime: "09:00", endTime: "10:30", color: "purple" },
  { id: "w7", title: "Morning Workout — Full Body", date: getThisWeekday(0), startTime: "07:00", endTime: "08:15", color: "blue" },
  { id: "m18", title: "Breakfast", date: getThisWeekday(0), startTime: "08:30", endTime: "09:00", color: "orange" },
  { id: "s9", title: "Study — Algorithms Review", date: getThisWeekday(0), startTime: "11:00", endTime: "13:00", color: "gray" },
  { id: "m19", title: "Lunch", date: getThisWeekday(0), startTime: "13:00", endTime: "13:45", color: "orange" },
  { id: "s10", title: "Study — CV Reading", date: getThisWeekday(0), startTime: "14:00", endTime: "16:00", color: "gray" },
  { id: "m20", title: "Dinner", date: getThisWeekday(0), startTime: "18:30", endTime: "19:15", color: "orange" },
  { id: "p4", title: "Relax / Free Time", date: getThisWeekday(0), startTime: "19:30", endTime: "21:00", color: "purple" },
];

export function getEventsForDate(events: CalendarEvent[], date: string): CalendarEvent[] {
  return events.filter((e) => e.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${hour} ${period}` : `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export function getDayName(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function getMonthName(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long" });
}

export function getDayNumber(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00");
  return d.getDate();
}

export function isToday(dateStr: string): boolean {
  return dateStr === getDateStr(0);
}

export function getUpcomingDates(days: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    dates.push(getDateStr(i));
  }
  return dates;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
