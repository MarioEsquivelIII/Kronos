import { z } from "zod";

const VALID_DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
] as const;

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const eventInputSchema = z.object({
  title: z.string().min(1).max(200),
  day_of_week: z.enum(VALID_DAYS),
  start_time: z.string().regex(timeRegex, "Time must be HH:MM format (24h)"),
  end_time: z.string().regex(timeRegex, "Time must be HH:MM format (24h)"),
  category: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  source_type: z.enum(["ai", "manual"]).default("ai"),
});

export const eventsArraySchema = z.array(eventInputSchema).min(1).max(200);

export const generateRequestSchema = z.object({
  prompt: z.string().min(5, "Please provide a more detailed description.").max(5000),
  title: z.string().min(1).max(200).optional(),
});

export const refineRequestSchema = z.object({
  calendar_id: z.string().uuid(),
  prompt: z.string().min(3, "Please provide more detail.").max(5000),
});

export const eventUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  day_of_week: z.enum(VALID_DAYS).optional(),
  start_time: z.string().regex(timeRegex).optional(),
  end_time: z.string().regex(timeRegex).optional(),
  category: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
});

export const manualEventSchema = z.object({
  calendar_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  day_of_week: z.enum(VALID_DAYS),
  start_time: z.string().regex(timeRegex),
  end_time: z.string().regex(timeRegex),
  category: z.string().min(1).max(100).default("Personal"),
  description: z.string().max(500).optional().nullable(),
});

// Normalize day names from AI output
export function normalizeDay(day: string): string | null {
  const mapping: Record<string, string> = {
    mon: "Monday", monday: "Monday",
    tue: "Tuesday", tues: "Tuesday", tuesday: "Tuesday",
    wed: "Wednesday", wednesday: "Wednesday",
    thu: "Thursday", thur: "Thursday", thurs: "Thursday", thursday: "Thursday",
    fri: "Friday", friday: "Friday",
    sat: "Saturday", saturday: "Saturday",
    sun: "Sunday", sunday: "Sunday",
  };
  return mapping[day.toLowerCase().trim()] || null;
}

// Normalize time strings: accept "9:00", "9:00 AM", "09:00", "1pm" etc.
export function normalizeTime(time: string): string | null {
  if (!time) return null;
  const cleaned = time.trim().toLowerCase();

  // Already in HH:MM 24h format
  if (timeRegex.test(cleaned)) return cleaned;

  // Handle "9:00 AM" / "9:00PM" style
  const amPmMatch = cleaned.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)$/);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = amPmMatch[2] ? parseInt(amPmMatch[2], 10) : 0;
    const period = amPmMatch[3];
    if (period === "pm" && hours !== 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  // Handle "9:00" without AM/PM (assume 24h)
  const simpleMatch = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (simpleMatch) {
    const h = parseInt(simpleMatch[1], 10);
    const m = parseInt(simpleMatch[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }
  }

  return null;
}

// Attempt to normalize and validate AI output
export function normalizeAIEvents(raw: unknown[]): z.infer<typeof eventsArraySchema> | null {
  try {
    const normalized = raw.map((item: unknown) => {
      const e = item as Record<string, unknown>;
      const day = normalizeDay(String(e.day_of_week || ""));
      const start = normalizeTime(String(e.start_time || ""));
      const end = normalizeTime(String(e.end_time || ""));
      return {
        title: String(e.title || "Untitled"),
        day_of_week: day || e.day_of_week,
        start_time: start || e.start_time,
        end_time: end || e.end_time,
        category: String(e.category || "Personal"),
        description: e.description ? String(e.description) : null,
        source_type: "ai" as const,
      };
    });
    return eventsArraySchema.parse(normalized);
  } catch {
    return null;
  }
}
