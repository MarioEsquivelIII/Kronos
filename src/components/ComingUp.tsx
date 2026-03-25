"use client";

import { CalendarEvent, getEventsForDate, formatTime, getDayName, getMonthName, getDayNumber, isToday, getUpcomingDates } from "@/lib/events";

interface ComingUpProps {
  events: CalendarEvent[];
  onContextMenu: (event: CalendarEvent, x: number, y: number) => void;
}

const colorMap: Record<string, string> = {
  green: "bg-[#5a8a4a]",
  blue: "bg-[#4a7a8a]",
  orange: "bg-[#8a7040]",
  red: "bg-[#8a4a4a]",
  purple: "bg-[#7a5a8a]",
  gray: "bg-[#6a6a6a]",
};

export default function ComingUp({ events, onContextMenu }: ComingUpProps) {
  const dates = getUpcomingDates(7);
  const datesWithEvents = dates.filter((d) => {
    const dayEvents = getEventsForDate(events, d);
    return dayEvents.length > 0 || isToday(d);
  });

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <h2 className="text-2xl font-semibold mb-6" style={{ color: "var(--text-primary)" }}>Coming up</h2>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)" }}>
        {datesWithEvents.map((date, idx) => {
          const dayEvents = getEventsForDate(events, date);
          const today = isToday(date);

          return (
            <div
              key={date}
              className="flex items-start gap-6 px-6 py-5 transition-colors"
              style={{ borderTop: idx > 0 ? "1px solid var(--border-subtle)" : undefined }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-tertiary)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {/* Date column */}
              <div className="flex-shrink-0 w-16 text-center">
                <div className="text-3xl font-bold transition-colors" style={{ color: today ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  {getDayNumber(date)}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {getMonthName(date).slice(0, 3)}
                </div>
                <div className="text-xs mt-0.5" style={{ color: today ? "var(--accent-green)" : "var(--text-muted)", fontWeight: today ? 500 : 400 }}>
                  {today ? "Today" : getDayName(date)}
                </div>
              </div>

              {/* Events column */}
              <div className="flex-1 min-w-0">
                {dayEvents.length === 0 ? (
                  <p className="text-sm py-1" style={{ color: "var(--text-muted)" }}>No events today</p>
                ) : (
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          onContextMenu(event, e.clientX, e.clientY);
                        }}
                        className="flex items-start gap-3 px-2.5 py-2 -mx-2.5 rounded-lg cursor-default active:scale-[0.99] transition-all group/event"
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <div className={`w-0.5 h-8 rounded-full mt-0.5 flex-shrink-0 transition-all group-hover/event:w-1 ${colorMap[event.color] || colorMap.green}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{event.title}</p>
                          <p className="text-xs transition-colors" style={{ color: "var(--text-muted)" }}>
                            {formatTime(event.startTime)} – {formatTime(event.endTime)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
