import { CalendarEvent, generateId } from "./events";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Simple NLP parser to extract events from natural language
export function parseEventFromMessage(message: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lower = message.toLowerCase();

  // Parse "gym 6-7 AM every weekday" style
  const gymMatch = lower.match(/gym\s+(\d{1,2})(?::(\d{2}))?\s*(?:-|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (gymMatch || lower.includes("gym")) {
    let startH = 6, endH = 7;
    if (gymMatch) {
      startH = parseInt(gymMatch[1]);
      endH = parseInt(gymMatch[3]);
      const period = gymMatch[5]?.toLowerCase();
      if (period === "pm" && startH < 12) { startH += 12; endH += 12; }
    }

    if (lower.includes("every") || lower.includes("weekday") || lower.includes("daily")) {
      // Add for next 5 weekdays
      for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const day = d.getDay();
        if (day >= 1 && day <= 5) {
          events.push({
            id: generateId(),
            title: "Gym",
            date: d.toISOString().split("T")[0],
            startTime: `${startH.toString().padStart(2, "0")}:00`,
            endTime: `${endH.toString().padStart(2, "0")}:00`,
            color: "blue",
          });
        }
      }
    } else {
      const d = new Date();
      events.push({
        id: generateId(),
        title: "Gym",
        date: d.toISOString().split("T")[0],
        startTime: `${startH.toString().padStart(2, "0")}:00`,
        endTime: `${endH.toString().padStart(2, "0")}:00`,
        color: "blue",
      });
    }
    return events;
  }

  // Parse generic "add [event] at [time]" or "add [event] [time]-[time]"
  const addMatch = lower.match(/(?:add|schedule|create|set|put)\s+(.+?)(?:\s+(?:at|from)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?(?:\s+(?:on\s+)?(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday))?/i);

  if (addMatch) {
    const title = addMatch[1]?.replace(/\b(at|from|on|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b.*/i, "").trim();
    let startH = addMatch[2] ? parseInt(addMatch[2]) : 9;
    const startM = addMatch[3] ? parseInt(addMatch[3]) : 0;
    let endH = addMatch[5] ? parseInt(addMatch[5]) : startH + 1;
    const endM = addMatch[6] ? parseInt(addMatch[6]) : 0;

    if (addMatch[4]?.toLowerCase() === "pm" && startH < 12) startH += 12;
    if (addMatch[7]?.toLowerCase() === "pm" && endH < 12) endH += 12;
    if (addMatch[4]?.toLowerCase() === "am" && startH === 12) startH = 0;
    if (addMatch[7]?.toLowerCase() === "am" && endH === 12) endH = 0;

    const dayStr = addMatch[8]?.toLowerCase();
    const d = new Date();
    if (dayStr === "tomorrow") {
      d.setDate(d.getDate() + 1);
    } else if (dayStr && dayStr !== "today") {
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const targetDay = days.indexOf(dayStr);
      const currentDay = d.getDay();
      const diff = (targetDay - currentDay + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
    }

    if (title && title.length > 0) {
      events.push({
        id: generateId(),
        title: title.charAt(0).toUpperCase() + title.slice(1),
        date: d.toISOString().split("T")[0],
        startTime: `${startH.toString().padStart(2, "0")}:${startM.toString().padStart(2, "0")}`,
        endTime: `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`,
        color: "green",
      });
    }
  }

  return events;
}

export function generateResponse(message: string, events: CalendarEvent[], allEvents: CalendarEvent[]): string {
  const lower = message.toLowerCase();

  // Greetings
  if (lower.match(/^(hi|hello|hey|what's up|sup)/)) {
    const todayEvents = allEvents.filter(e => e.date === new Date().toISOString().split("T")[0]);
    if (todayEvents.length === 0) {
      return "Hey! Your day is clear — no events scheduled. Want to add something?";
    }
    return `Hey! You have ${todayEvents.length} event${todayEvents.length > 1 ? "s" : ""} today. What would you like to do?`;
  }

  // What's planned / today / schedule
  if (lower.match(/(what|how).*(planned|schedule|today|look|going on|happening)/)) {
    const today = new Date().toISOString().split("T")[0];
    const todayEvents = allEvents.filter(e => e.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime));
    if (todayEvents.length === 0) {
      return "You have a clear day today! Want me to add something to your schedule?";
    }
    const list = todayEvents.map(e => {
      const [sh, sm] = e.startTime.split(":").map(Number);
      const sp = sh >= 12 ? "PM" : "AM";
      const shr = sh > 12 ? sh - 12 : sh === 0 ? 12 : sh;
      const [eh, em] = e.endTime.split(":").map(Number);
      const ep = eh >= 12 ? "PM" : "AM";
      const ehr = eh > 12 ? eh - 12 : eh === 0 ? 12 : eh;
      return `  • ${e.title} — ${shr}${sm ? `:${sm.toString().padStart(2, "0")}` : ""} ${sp} to ${ehr}${em ? `:${em.toString().padStart(2, "0")}` : ""} ${ep}`;
    }).join("\n");
    return `Here's your day:\n\n${list}\n\nAnything you'd like to change?`;
  }

  // Week view
  if (lower.match(/(week|this week|next few days)/)) {
    const upcoming = allEvents.slice(0, 8).map(e => `  • ${e.title} (${e.date})`).join("\n");
    return `Here's what's coming up:\n\n${upcoming}`;
  }

  // If events were created
  if (events.length > 0) {
    if (events.length === 1) {
      return `Done! I've added "${events[0].title}" to your calendar. Anything else?`;
    }
    return `Done! I've added ${events.length} events to your calendar:\n${events.map(e => `  • ${e.title} (${e.date})`).join("\n")}\n\nAnything else?`;
  }

  // Export / sync
  if (lower.match(/(export|sync|google|notion)/)) {
    return "To sync with Google Calendar, click the export button in the calendar view. I'll get everything synced up for you!";
  }

  // Fallback
  return "I can help you manage your schedule! Try:\n  • \"Add gym 6-7 AM every weekday\"\n  • \"What's planned for today?\"\n  • \"Schedule a meeting at 2 PM tomorrow\"";
}
