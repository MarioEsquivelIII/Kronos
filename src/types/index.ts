export interface CalendarEvent {
  id: string;
  calendar_id: string;
  title: string;
  day_of_week: DayOfWeek;
  start_time: string; // HH:MM format
  end_time: string;   // HH:MM format
  category: string;
  description: string | null;
  source_type: "ai" | "manual";
  created_at: string;
  updated_at: string;
}

export interface Calendar {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  events?: CalendarEvent[];
}

export interface Revision {
  id: string;
  calendar_id: string;
  prompt_used: string;
  model_response_json: CalendarEventInput[];
  created_at: string;
}

export interface CalendarEventInput {
  title: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  category: string;
  description?: string | null;
  source_type: "ai" | "manual";
}

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const CATEGORY_COLORS: Record<string, string> = {
  Academic: "#4263eb",
  Work: "#1971c2",
  Exercise: "#2f9e44",
  Health: "#2f9e44",
  Meal: "#e8590c",
  Social: "#9c36b5",
  Personal: "#0c8599",
  Rest: "#868e96",
  Sleep: "#495057",
  Creative: "#f08c00",
  Coding: "#5c7cfa",
  Study: "#4263eb",
  Break: "#adb5bd",
  Default: "#868e96",
};

export function getCategoryColor(category: string): string {
  const normalized = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  return CATEGORY_COLORS[normalized] || CATEGORY_COLORS[category] || CATEGORY_COLORS.Default;
}
