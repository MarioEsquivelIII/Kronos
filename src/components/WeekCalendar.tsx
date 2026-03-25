"use client";

import { useState, useRef, useCallback } from "react";
import { CalendarEvent, getEventsForDate, formatTime, getDayName, getDayNumber, getMonthName, isToday, generateId } from "@/lib/events";

type CalendarViewMode = "day" | "week" | "month";

interface WeekCalendarProps {
  events: CalendarEvent[];
  onContextMenu: (event: CalendarEvent, x: number, y: number) => void;
  onAddEvent: (event: CalendarEvent) => void;
  onClickEvent: (event: CalendarEvent, x: number, y: number) => void;
}

const colorMap: Record<string, string> = {
  green: "bg-[#5a8a4a]/85 border-[#5a8a4a]",
  blue: "bg-[#4a7a8a]/85 border-[#4a7a8a]",
  orange: "bg-[#8a7040]/85 border-[#8a7040]",
  red: "bg-[#8a4a4a]/85 border-[#8a4a4a]",
  purple: "bg-[#7a5a8a]/85 border-[#7a5a8a]",
  gray: "bg-[#6a6a6a]/85 border-[#6a6a6a]",
};

const dotColorMap: Record<string, string> = {
  green: "#5a8a4a",
  blue: "#4a7a8a",
  orange: "#8a7040",
  red: "#8a4a4a",
  purple: "#7a5a8a",
  gray: "#6a6a6a",
};

const HOUR_HEIGHT = 56;

function getMonthGridDates(year: number, month: number): string[] {
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(1 - firstDay.getDay());
  const dates: string[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function getDatesForView(viewMode: CalendarViewMode, numDays: number, offset: number): string[] {
  if (viewMode === "month") {
    const today = new Date();
    const targetMonth = today.getMonth() + offset;
    const targetDate = new Date(today.getFullYear(), targetMonth, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const dates: string[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(new Date(year, month, i).toISOString().split("T")[0]);
    }
    return dates;
  }

  const today = new Date();
  today.setDate(today.getDate() + offset);

  if (viewMode === "day") {
    return [today.toISOString().split("T")[0]];
  }

  // week
  const dayOfWeek = today.getDay();
  const dates: string[] = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOfWeek + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

export default function WeekCalendar({ events, onContextMenu, onAddEvent, onClickEvent }: WeekCalendarProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [numDays, setNumDays] = useState(7);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showDaysMenu, setShowDaysMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showWeekends, setShowWeekends] = useState(true);
  const [showDeclinedEvents, setShowDeclinedEvents] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [dragging, setDragging] = useState(false);
  const [dragDate, setDragDate] = useState<string | null>(null);
  const [dragStartHour, setDragStartHour] = useState<number | null>(null);
  const [dragEndHour, setDragEndHour] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const effectiveOffset = viewMode === "month" ? weekOffset : weekOffset * numDays;
  const allDates = getDatesForView(viewMode, numDays, effectiveOffset);
  const displayDates = showWeekends ? allDates : allDates.filter(d => {
    const day = new Date(d + "T12:00:00").getDay();
    return day !== 0 && day !== 6;
  });

  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  const monthLabel = (() => {
    if (viewMode === "month") {
      const today = new Date();
      const targetMonth = today.getMonth() + weekOffset;
      const targetDate = new Date(today.getFullYear(), targetMonth, 1);
      const monthName = targetDate.toLocaleDateString("en-US", { month: "long" });
      return `${monthName} ${targetDate.getFullYear()}`;
    }
    if (displayDates.length === 0) return "";
    const first = new Date(displayDates[0] + "T12:00:00");
    return `${getMonthName(displayDates[0])} ${first.getFullYear()}`;
  })();

  // Month grid data
  const monthGridDates = (() => {
    if (viewMode !== "month") return [];
    const today = new Date();
    const targetMonth = today.getMonth() + weekOffset;
    const targetDate = new Date(today.getFullYear(), targetMonth, 1);
    return getMonthGridDates(targetDate.getFullYear(), targetDate.getMonth());
  })();

  const currentMonthIndex = (() => {
    if (viewMode !== "month") return -1;
    const today = new Date();
    const targetMonth = today.getMonth() + weekOffset;
    const targetDate = new Date(today.getFullYear(), targetMonth, 1);
    return targetDate.getMonth();
  })();

  const handleMouseDown = (date: string, hour: number) => {
    setDragging(true);
    setDragDate(date);
    setDragStartHour(hour);
    setDragEndHour(hour + 1);
  };

  const handleMouseMove = useCallback((hour: number) => {
    if (!dragging || dragStartHour === null) return;
    setDragEndHour(Math.min(Math.max(hour + 1, dragStartHour + 1), 24));
  }, [dragging, dragStartHour]);

  const handleMouseUp = () => {
    if (dragging && dragDate && dragStartHour !== null && dragEndHour !== null) {
      const start = Math.min(dragStartHour, dragEndHour - 1);
      const end = Math.max(dragStartHour + 1, dragEndHour);
      const newEvent: CalendarEvent = {
        id: generateId(),
        title: "New Event",
        date: dragDate,
        startTime: `${start.toString().padStart(2, "0")}:00`,
        endTime: `${end.toString().padStart(2, "0")}:00`,
        color: "green",
      };
      onAddEvent(newEvent);
      setTimeout(() => onClickEvent(newEvent, window.innerWidth / 2, 200), 50);
    }
    setDragging(false);
    setDragDate(null);
    setDragStartHour(null);
    setDragEndHour(null);
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      alert("Calendar synced to Google Calendar! (In production, this would use the Google Calendar API with OAuth.)");
    }, 1500);
  };

  const handlePrev = () => setWeekOffset(weekOffset - 1);
  const handleNext = () => setWeekOffset(weekOffset + 1);

  const colTemplate = `60px repeat(${displayDates.length}, 1fr)`;
  const weekdayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MAX_VISIBLE_EVENTS = 3;

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {/* Calendar toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold font-heading" style={{ color: "var(--text-primary)" }}>{monthLabel}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Sync button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50"
            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={syncing ? "animate-spin" : ""}>
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            {syncing ? "Syncing..." : "Sync to Google"}
          </button>

          {/* View mode dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowViewMenu(!showViewMenu); setShowDaysMenu(false); setShowSettingsMenu(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
            >
              {viewMode === "day" ? "Day" : viewMode === "week" ? "Week" : "Month"}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {showViewMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl shadow-2xl overflow-hidden z-50" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
                {([
                  { m: "day" as CalendarViewMode, label: "Day", shortcut: "1 or D" },
                  { m: "week" as CalendarViewMode, label: "Week", shortcut: "0 or W" },
                  { m: "month" as CalendarViewMode, label: "Month", shortcut: "M" },
                ]).map(({ m, label, shortcut }) => (
                  <button
                    key={m}
                    onClick={() => { setViewMode(m); setWeekOffset(0); setShowViewMenu(false); if (m === "day") setNumDays(1); else if (m === "week") setNumDays(7); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors"
                    style={{ color: viewMode === m ? "var(--text-primary)" : "var(--text-secondary)", background: viewMode === m ? "var(--bg-hover)" : "transparent" }}
                  >
                    <div className="flex items-center gap-2">
                      {viewMode === m && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5a8a4a" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                      {viewMode !== m && <div className="w-3" />}
                      {label}
                    </div>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{shortcut}</span>
                  </button>
                ))}

                <div style={{ borderTop: "1px solid var(--border-color)" }} />

                {/* Number of days */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDaysMenu(!showDaysMenu); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3" />
                      Number of days
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                  {showDaysMenu && (
                    <div className="absolute left-full top-0 ml-1 w-36 rounded-xl shadow-2xl overflow-hidden z-50" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
                      {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <button
                          key={n}
                          onClick={() => { setNumDays(n); setViewMode("week"); setShowDaysMenu(false); setShowViewMenu(false); }}
                          className="w-full flex items-center justify-between px-3 py-1.5 text-sm transition-colors"
                          style={{ color: numDays === n ? "var(--text-primary)" : "var(--text-secondary)", background: numDays === n ? "var(--bg-hover)" : "transparent" }}
                        >
                          {n} days
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{n}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* View settings */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowSettingsMenu(!showSettingsMenu); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3" />
                      View settings
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                  {showSettingsMenu && (
                    <div className="absolute left-full top-0 ml-1 w-56 rounded-xl shadow-2xl overflow-hidden z-50" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
                      <button
                        onClick={() => setShowWeekends(!showWeekends)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <div className="flex items-center gap-2">
                          {showWeekends && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5a8a4a" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                          {!showWeekends && <div className="w-3" />}
                          Weekends
                        </div>
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>shift+E</span>
                      </button>
                      <button
                        onClick={() => setShowDeclinedEvents(!showDeclinedEvents)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {showDeclinedEvents && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5a8a4a" strokeWidth="3" className="flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>}
                          {!showDeclinedEvents && <div className="w-3 flex-shrink-0" />}
                          <span className="truncate">Declined eve...</span>
                        </div>
                        <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>shift &#8984; D</span>
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors" style={{ color: "var(--text-secondary)" }}>
                        <div className="w-3" />
                        Week numbers
                      </button>
                      <div style={{ borderTop: "1px solid var(--border-color)" }} />
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors" style={{ color: "var(--text-secondary)" }}>
                        <div className="w-3" />
                        General settings
                        <span className="ml-auto text-[10px]" style={{ color: "var(--text-muted)" }}>Cmd+,</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Today button */}
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={weekOffset === 0
              ? { background: "var(--accent-green)", color: "white" }
              : { background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }
            }
          >
            Today
          </button>

          {/* Nav arrows */}
          <div className="flex items-center gap-0.5">
            <button onClick={handlePrev} className="p-1.5 rounded-md transition-colors" onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-tertiary)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button onClick={handleNext} className="p-1.5 rounded-md transition-colors" onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-tertiary)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      {viewMode === "month" ? (
        /* ===== MONTH VIEW ===== */
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)" }}>
          {/* Weekday header */}
          <div className="grid grid-cols-7" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            {weekdayHeaders.map((day) => (
              <div key={day} className="px-2 py-2.5 text-center text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                {day}
              </div>
            ))}
          </div>

          {/* Date grid - 6 rows of 7 */}
          <div className="grid grid-cols-7">
            {monthGridDates.map((dateStr, idx) => {
              const dateObj = new Date(dateStr + "T12:00:00");
              const isCurrentMonth = dateObj.getMonth() === currentMonthIndex;
              const isTodayDate = isToday(dateStr);
              const dayEvents = getEventsForDate(events, dateStr);
              const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
              const extraCount = dayEvents.length - MAX_VISIBLE_EVENTS;

              return (
                <div
                  key={dateStr + idx}
                  className="min-h-[100px] p-1.5 relative"
                  style={{
                    borderTop: idx >= 7 ? "1px solid var(--border-subtle)" : undefined,
                    borderLeft: idx % 7 !== 0 ? "1px solid var(--border-subtle)" : undefined,
                  }}
                >
                  {/* Day number */}
                  <div className="flex justify-center mb-1">
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium"
                      style={isTodayDate
                        ? { background: "#5a8a4a", color: "white" }
                        : { color: isCurrentMonth ? "var(--text-primary)" : "var(--text-muted)" }
                      }
                    >
                      {dateObj.getDate()}
                    </span>
                  </div>

                  {/* Compact event listings */}
                  <div className="space-y-0.5">
                    {visibleEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); onClickEvent(event, e.clientX, e.clientY); }}
                        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(event, e.clientX, e.clientY); }}
                        className="w-full flex items-center gap-1 px-1 py-0.5 rounded text-left transition-colors truncate"
                        style={{ color: isCurrentMonth ? "var(--text-primary)" : "var(--text-muted)" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: dotColorMap[event.color] || dotColorMap.green }}
                        />
                        <span className="text-[10px] truncate">
                          <span style={{ color: "var(--text-muted)" }}>{formatTime(event.startTime).replace(" ", "")}</span>
                          {" "}
                          <span className="truncate">{event.title}</span>
                        </span>
                      </button>
                    ))}
                    {extraCount > 0 && (
                      <div className="text-[10px] px-1 py-0.5 font-medium" style={{ color: "var(--text-muted)" }}>
                        +{extraCount} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ===== DAY / WEEK VIEW ===== */
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)" }}>
          {/* Header */}
          <div className="grid" style={{ gridTemplateColumns: colTemplate, borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="px-2 py-3 text-xs" style={{ color: "var(--text-muted)" }}></div>
            {displayDates.map((date) => {
              const today = isToday(date);
              return (
                <div key={date} className="px-2 py-3 text-center transition-colors">
                  <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{getDayName(date)}</div>
                  <div
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all"
                    style={today
                      ? { background: "var(--accent-green)", color: "white" }
                      : { color: "var(--text-primary)" }
                    }
                  >
                    {getDayNumber(date)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div
            ref={gridRef}
            className="max-h-[500px] overflow-y-auto select-none"
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="grid relative" style={{ gridTemplateColumns: colTemplate }}>
              {hours.map((hour) => (
                <div key={hour} className="contents">
                  <div className="px-2 py-0 h-14 flex items-start justify-end pr-3">
                    <span className="text-[10px] -mt-1.5" style={{ color: "var(--text-muted)" }}>
                      {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                    </span>
                  </div>
                  {displayDates.map((date) => (
                    <div
                      key={`${date}-${hour}`}
                      className="h-14 relative transition-colors cursor-crosshair"
                      style={{ borderTop: "1px solid var(--border-subtle)", borderLeft: "1px solid var(--border-subtle)" }}
                      onMouseDown={(e) => { if (e.button === 0) handleMouseDown(date, hour); }}
                      onMouseMove={() => handleMouseMove(hour)}
                    >
                      {/* Drag preview */}
                      {dragging && dragDate === date && dragStartHour !== null && dragEndHour !== null && hour === Math.min(dragStartHour, dragEndHour - 1) && (
                        <div
                          className="absolute left-0.5 right-0.5 rounded-md bg-[#5a8a4a]/50 border border-[#5a8a4a] z-20 pointer-events-none"
                          style={{ top: 0, height: `${Math.abs((dragEndHour || dragStartHour + 1) - dragStartHour) * HOUR_HEIGHT}px` }}
                        >
                          <p className="text-[10px] text-white/80 px-1.5 pt-1">New Event</p>
                        </div>
                      )}

                      {/* Events */}
                      {getEventsForDate(events, date)
                        .filter((e) => parseInt(e.startTime.split(":")[0]) === hour)
                        .map((event) => {
                          const startH = parseInt(event.startTime.split(":")[0]);
                          const startM = parseInt(event.startTime.split(":")[1]);
                          const endH = parseInt(event.endTime.split(":")[0]);
                          const endM = parseInt(event.endTime.split(":")[1]);
                          const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
                          const heightPx = (durationMinutes / 60) * HOUR_HEIGHT;
                          const topPx = (startM / 60) * HOUR_HEIGHT;

                          return (
                            <div
                              key={event.id}
                              onClick={(e) => { e.stopPropagation(); onClickEvent(event, e.clientX, e.clientY); }}
                              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(event, e.clientX, e.clientY); }}
                              onMouseDown={(e) => e.stopPropagation()}
                              className={`absolute left-0.5 right-0.5 rounded-md border-l-2 px-1.5 py-1 overflow-hidden z-10 cursor-pointer hover:brightness-125 hover:scale-[1.02] hover:z-20 active:scale-100 transition-all ${colorMap[event.color] || colorMap.green}`}
                              style={{ top: `${topPx}px`, height: `${Math.max(heightPx, 24)}px` }}
                            >
                              <p className="text-[10px] font-medium text-white truncate">{event.title}</p>
                              {heightPx > 30 && (
                                <p className="text-[9px] text-white/70 truncate">
                                  {formatTime(event.startTime)} – {formatTime(event.endTime)}
                                </p>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
