"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { CalendarEvent, getEventsForDate, formatTime, getDayName, getDayNumber, getMonthName, isToday, generateId } from "@/lib/events";

type CalendarViewMode = "day" | "week" | "month";

interface WeekCalendarProps {
  events: CalendarEvent[];
  onContextMenu: (event: CalendarEvent, x: number, y: number) => void;
  onAddEvent: (event: CalendarEvent) => void;
  onClickEvent: (event: CalendarEvent, x: number, y: number) => void;
  onUpdateEvent?: (event: CalendarEvent) => void;
}

const EVENT_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  green:  { bg: "var(--ev-green-bg)",  border: "var(--ev-green-border)",  text: "var(--ev-green-text)" },
  blue:   { bg: "var(--ev-blue-bg)",   border: "var(--ev-blue-border)",   text: "var(--ev-blue-text)" },
  orange: { bg: "var(--ev-orange-bg)", border: "var(--ev-orange-border)", text: "var(--ev-orange-text)" },
  red:    { bg: "var(--ev-red-bg)",    border: "var(--ev-red-border)",    text: "var(--ev-red-text)" },
  purple: { bg: "var(--ev-purple-bg)", border: "var(--ev-purple-border)", text: "var(--ev-purple-text)" },
  gray:   { bg: "var(--ev-gray-bg)",   border: "var(--ev-gray-border)",   text: "var(--ev-gray-text)" },
};

const dotColorMap: Record<string, string> = {
  green: "var(--ev-green-border)", blue: "var(--ev-blue-border)", orange: "var(--ev-orange-border)",
  red: "var(--ev-red-border)", purple: "var(--ev-purple-border)", gray: "var(--ev-gray-border)",
};

const HOUR_HEIGHT = 60;

/* ── Overlap layout (Google Calendar style) ── */

interface OverlapInfo {
  column: number;
  totalColumns: number;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Compute column assignments for overlapping events on a single day. */
function computeOverlapLayout(dayEvents: CalendarEvent[]): Map<string, OverlapInfo> {
  const layout = new Map<string, OverlapInfo>();
  if (dayEvents.length === 0) return layout;

  // Sort by start time, then longer events first
  const sorted = [...dayEvents].sort((a, b) => {
    const d = toMinutes(a.startTime) - toMinutes(b.startTime);
    return d !== 0 ? d : toMinutes(b.endTime) - toMinutes(a.endTime);
  });

  // Group into overlapping clusters
  const clusters: CalendarEvent[][] = [];
  let clusterEnd = 0;
  let current: CalendarEvent[] = [];

  for (const ev of sorted) {
    const start = toMinutes(ev.startTime);
    if (current.length === 0 || start < clusterEnd) {
      // overlaps with current cluster
      current.push(ev);
      clusterEnd = Math.max(clusterEnd, toMinutes(ev.endTime));
    } else {
      clusters.push(current);
      current = [ev];
      clusterEnd = toMinutes(ev.endTime);
    }
  }
  if (current.length > 0) clusters.push(current);

  // Within each cluster, greedily assign columns
  for (const cluster of clusters) {
    const columns: number[] = []; // each entry = end-minute of the event occupying that column
    for (const ev of cluster) {
      const start = toMinutes(ev.startTime);
      let col = 0;
      while (col < columns.length && columns[col] > start) {
        col++;
      }
      if (col === columns.length) columns.push(0);
      columns[col] = toMinutes(ev.endTime);
      layout.set(ev.id, { column: col, totalColumns: 0 });
    }
    const total = columns.length;
    for (const ev of cluster) {
      const info = layout.get(ev.id)!;
      info.totalColumns = total;
    }
  }

  return layout;
}

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
  if (viewMode === "day") return [today.toISOString().split("T")[0]];
  const dayOfWeek = today.getDay();
  const dates: string[] = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOfWeek + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function useCurrentTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);
  return now;
}

export default function WeekCalendar({ events, onContextMenu, onAddEvent, onClickEvent, onUpdateEvent }: WeekCalendarProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [numDays, setNumDays] = useState(7);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showWeekends, setShowWeekends] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [dragDate, setDragDate] = useState<string | null>(null);
  const [dragStartHour, setDragStartHour] = useState<number | null>(null);
  const [dragEndHour, setDragEndHour] = useState<number | null>(null);
  // Drag-to-move existing events
  const [movingEvent, setMovingEvent] = useState<CalendarEvent | null>(null);
  const [moveTargetDate, setMoveTargetDate] = useState<string | null>(null);
  const [moveTargetMinute, setMoveTargetMinute] = useState<number | null>(null);
  const [moveDidDrag, setMoveDidDrag] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const now = useCurrentTime();

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
      return `${targetDate.toLocaleDateString("en-US", { month: "long" })} ${targetDate.getFullYear()}`;
    }
    if (displayDates.length === 0) return "";
    const first = new Date(displayDates[0] + "T12:00:00");
    const last = new Date(displayDates[displayDates.length - 1] + "T12:00:00");
    if (first.getMonth() === last.getMonth()) {
      return `${getMonthName(displayDates[0])} ${first.getFullYear()}`;
    }
    return `${first.toLocaleDateString("en-US", { month: "short" })} – ${last.toLocaleDateString("en-US", { month: "short" })} ${last.getFullYear()}`;
  })();

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
    return new Date(today.getFullYear(), targetMonth, 1).getMonth();
  })();

  const handleMouseDown = (date: string, hour: number) => {
    setDragging(true); setDragDate(date); setDragStartHour(hour); setDragEndHour(hour + 1);
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
        id: generateId(), title: "New Event", date: dragDate,
        startTime: `${start.toString().padStart(2, "0")}:00`,
        endTime: `${end.toString().padStart(2, "0")}:00`, color: "green",
      };
      onAddEvent(newEvent);
      setTimeout(() => onClickEvent(newEvent, window.innerWidth / 2, 200), 50);
    }
    setDragging(false); setDragDate(null); setDragStartHour(null); setDragEndHour(null);
  };

  // --- Drag-to-move handlers ---
  const handleEventDragStart = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMovingEvent(event);
    setMoveTargetDate(event.date);
    setMoveTargetMinute(toMinutes(event.startTime));
    setMoveDidDrag(false);
  };

  const handleCellMouseMoveForDrag = useCallback((date: string, e: React.MouseEvent) => {
    if (movingEvent) {
      const rect = e.currentTarget.getBoundingClientRect();
      const yInCell = e.clientY - rect.top;
      const hour = parseInt(e.currentTarget.getAttribute("data-hour") || "0");
      // Snap to 15-minute increments
      const minuteInHour = Math.floor((yInCell / HOUR_HEIGHT) * 60 / 15) * 15;
      const totalMinute = hour * 60 + Math.max(0, Math.min(minuteInHour, 45));
      setMoveTargetDate(date);
      setMoveTargetMinute(totalMinute);
      setMoveDidDrag(true);
      return;
    }
    // Existing create-drag behavior
    if (dragging) {
      const hour = parseInt(e.currentTarget.getAttribute("data-hour") || "0");
      handleMouseMove(hour);
    }
  }, [movingEvent, dragging, handleMouseMove]);

  const handleGlobalMouseUp = useCallback(() => {
    if (movingEvent && moveTargetDate !== null && moveTargetMinute !== null && moveDidDrag && onUpdateEvent) {
      const duration = toMinutes(movingEvent.endTime) - toMinutes(movingEvent.startTime);
      const newStartMinute = moveTargetMinute;
      const newEndMinute = newStartMinute + duration;
      const startH = Math.floor(newStartMinute / 60);
      const startM = newStartMinute % 60;
      const endH = Math.floor(newEndMinute / 60);
      const endM = newEndMinute % 60;
      onUpdateEvent({
        ...movingEvent,
        date: moveTargetDate,
        startTime: `${startH.toString().padStart(2, "0")}:${startM.toString().padStart(2, "0")}`,
        endTime: `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`,
      });
    }
    if (movingEvent && !moveDidDrag) {
      // It was a click, not a drag — do nothing (let onClick handle it)
    }
    setMovingEvent(null);
    setMoveTargetDate(null);
    setMoveTargetMinute(null);
    setMoveDidDrag(false);
  }, [movingEvent, moveTargetDate, moveTargetMinute, moveDidDrag, onUpdateEvent]);

  useEffect(() => {
    if (movingEvent) {
      window.addEventListener("mouseup", handleGlobalMouseUp);
      return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
    }
  }, [movingEvent, handleGlobalMouseUp]);

  const handlePrev = () => setWeekOffset(weekOffset - 1);
  const handleNext = () => setWeekOffset(weekOffset + 1);

  const colTemplate = `56px repeat(${displayDates.length}, 1fr)`;
  const weekdayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Pre-compute overlap layout once per day (avoids recalculating inside hour loop)
  const overlapLayouts = new Map<string, Map<string, OverlapInfo>>();
  for (const date of displayDates) {
    overlapLayouts.set(date, computeOverlapLayout(getEventsForDate(events, date)));
  }

  // Current time position
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const nowTopPx = ((nowHour - 6) * HOUR_HEIGHT) + (nowMinute / 60) * HOUR_HEIGHT;
  const todayStr = now.toISOString().split("T")[0];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar — Google Calendar style */}
      <div className="flex items-center justify-between h-10 px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Today */}
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
            style={weekOffset === 0
              ? { background: "var(--accent)", color: "white" }
              : { border: "1px solid var(--border-color)", color: "var(--text-secondary)" }
            }
          >
            Today
          </button>

          {/* Nav arrows */}
          <div className="flex items-center gap-1">
            <button onClick={handlePrev} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button onClick={handleNext} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>

          {/* Month label */}
          <h2 className="text-[17px] font-medium" style={{ color: "var(--text-primary)" }}>{monthLabel}</h2>
        </div>

        {/* View selector */}
        <div className="relative">
          <button
            onClick={() => setShowViewMenu(!showViewMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
            style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
          >
            {viewMode === "day" ? "Day" : viewMode === "week" ? "Week" : "Month"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          {showViewMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 rounded-lg shadow-lg overflow-hidden z-50" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
              {([
                { m: "day" as CalendarViewMode, label: "Day" },
                { m: "week" as CalendarViewMode, label: "Week" },
                { m: "month" as CalendarViewMode, label: "Month" },
              ]).map(({ m, label }) => (
                <button
                  key={m}
                  onClick={() => { setViewMode(m); setWeekOffset(0); setShowViewMenu(false); if (m === "day") setNumDays(1); else if (m === "week") setNumDays(7); }}
                  className="w-full text-left px-3 py-2 text-[13px] transition-colors"
                  style={{ color: viewMode === m ? "var(--accent)" : "var(--text-primary)", background: viewMode === m ? "var(--bg-hover)" : "transparent", fontWeight: viewMode === m ? 500 : 400 }}
                  onMouseEnter={(e) => { if (viewMode !== m) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { if (viewMode !== m) e.currentTarget.style.background = "transparent"; }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== MONTH VIEW ===== */}
      {viewMode === "month" ? (
        <div className="flex-1 min-h-0 overflow-hidden" style={{ background: "var(--card-bg)", borderTop: "1px solid var(--border-color)" }}>
          <div className="grid grid-cols-7" style={{ borderBottom: "1px solid var(--border-color)" }}>
            {weekdayHeaders.map((day) => (
              <div key={day} className="px-2 py-2 text-center text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthGridDates.map((dateStr, idx) => {
              const dateObj = new Date(dateStr + "T12:00:00");
              const isCurrentMonth = dateObj.getMonth() === currentMonthIndex;
              const isTodayDate = isToday(dateStr);
              const dayEvents = getEventsForDate(events, dateStr);
              const visibleEvents = dayEvents.slice(0, 3);
              const extraCount = dayEvents.length - 3;

              return (
                <div key={dateStr + idx} className="min-h-[100px] p-1.5"
                  style={{ borderTop: idx >= 7 ? "1px solid var(--grid-line-strong)" : undefined, borderLeft: idx % 7 !== 0 ? "1px solid var(--grid-line-strong)" : undefined }}>
                  <div className="flex justify-center mb-1">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs"
                      style={isTodayDate ? { background: "var(--accent)", color: "white", fontWeight: 600 } : { color: isCurrentMonth ? "var(--text-primary)" : "var(--text-muted)", fontWeight: isCurrentMonth ? 500 : 400 }}>
                      {dateObj.getDate()}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {visibleEvents.map((event) => {
                      const es = EVENT_STYLES[event.color] || EVENT_STYLES.green;
                      return (
                        <button key={event.id}
                          onClick={(e) => { e.stopPropagation(); onClickEvent(event, e.clientX, e.clientY); }}
                          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(event, e.clientX, e.clientY); }}
                          className="w-full flex items-center gap-1 px-1 py-0.5 rounded text-left truncate transition-colors"
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: dotColorMap[event.color] }} />
                          <span className="text-[10px] truncate" style={{ color: es.text }}>
                            {event.title}
                          </span>
                        </button>
                      );
                    })}
                    {extraCount > 0 && (
                      <div className="text-[10px] px-1 py-0.5 font-medium" style={{ color: "var(--text-muted)" }}>+{extraCount} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ===== DAY / WEEK VIEW ===== */
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden" style={{ background: "var(--card-bg)", borderTop: "1px solid var(--border-color)" }}>
          {/* Day headers */}
          <div className="grid shrink-0" style={{ gridTemplateColumns: colTemplate, borderBottom: "1px solid var(--border-color)" }}>
            <div />
            {displayDates.map((date) => {
              const today = isToday(date);
              return (
                <div key={date} className="py-2.5 text-center">
                  <div className="text-[11px] uppercase tracking-wider mb-0.5" style={{ color: today ? "var(--accent)" : "var(--text-muted)", fontWeight: 500 }}>
                    {getDayName(date)}
                  </div>
                  <div
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full text-[15px] transition-all"
                    style={today ? { background: "var(--accent)", color: "white", fontWeight: 600 } : { color: "var(--text-primary)", fontWeight: 400 }}
                  >
                    {getDayNumber(date)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div ref={gridRef} className="flex-1 min-h-0 overflow-y-auto select-none" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="grid relative" style={{ gridTemplateColumns: colTemplate }}>
              {hours.map((hour) => (
                <div key={hour} className="contents">
                  {/* Time label */}
                  <div className="h-[60px] flex items-start justify-end pr-2 pt-0">
                    <span className="text-[11px] -mt-2 font-light" style={{ color: "var(--text-muted)" }}>
                      {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                    </span>
                  </div>
                  {/* Day cells */}
                  {displayDates.map((date) => {
                    const overlapLayout = overlapLayouts.get(date)!;
                    const cellEvents = getEventsForDate(events, date).filter((e) => parseInt(e.startTime.split(":")[0]) === hour);

                    return (
                      <div
                        key={`${date}-${hour}`}
                        data-hour={hour}
                        className="h-[60px] relative cursor-crosshair"
                        style={{ borderTop: "1px solid var(--grid-line)", borderLeft: "1px solid var(--grid-line)" }}
                        onMouseDown={(e) => { if (e.button === 0 && !movingEvent) handleMouseDown(date, hour); }}
                        onMouseMove={(e) => handleCellMouseMoveForDrag(date, e)}
                      >
                        {/* Half-hour line */}
                        <div className="absolute left-0 right-0 top-[30px]" style={{ borderTop: "1px dashed var(--grid-line)" }} />

                        {/* Current time line */}
                        {date === todayStr && hour === nowHour && (
                          <div className="now-line" style={{ top: `${(nowMinute / 60) * HOUR_HEIGHT}px` }} />
                        )}

                        {/* Drag preview */}
                        {dragging && dragDate === date && dragStartHour !== null && dragEndHour !== null && hour === Math.min(dragStartHour, dragEndHour - 1) && (
                          <div className="absolute left-1 right-1 rounded-md z-20 pointer-events-none"
                            style={{ top: 0, height: `${Math.abs((dragEndHour || dragStartHour + 1) - dragStartHour) * HOUR_HEIGHT}px`, background: "var(--ev-green-bg)", border: "1px solid var(--ev-green-border)", borderLeft: "3px solid var(--ev-green-border)" }}>
                            <p className="text-[11px] px-2 pt-1" style={{ color: "var(--ev-green-text)" }}>New Event</p>
                          </div>
                        )}

                        {/* Drag-to-move ghost preview */}
                        {movingEvent && moveTargetDate === date && moveTargetMinute !== null && (() => {
                          const ghostStartMinute = moveTargetMinute;
                          const ghostHour = Math.floor(ghostStartMinute / 60);
                          if (ghostHour !== hour) return null;
                          const duration = toMinutes(movingEvent.endTime) - toMinutes(movingEvent.startTime);
                          const ghostHeightPx = (duration / 60) * HOUR_HEIGHT;
                          const ghostTopPx = ((ghostStartMinute % 60) / 60) * HOUR_HEIGHT;
                          const es = EVENT_STYLES[movingEvent.color] || EVENT_STYLES.green;
                          return (
                            <div
                              className="cal-event absolute left-1 right-1 z-30 pointer-events-none"
                              style={{
                                top: `${ghostTopPx}px`,
                                height: `${Math.max(ghostHeightPx, 22)}px`,
                                background: es.bg,
                                borderLeftColor: es.border,
                                opacity: 0.7,
                              }}
                            >
                              <p className="text-[11px] font-medium truncate leading-tight" style={{ color: es.text }}>{movingEvent.title}</p>
                              {ghostHeightPx > 34 && (
                                <p className="text-[10px] truncate mt-px" style={{ color: es.text, opacity: 0.7 }}>
                                  {formatTime(`${Math.floor(ghostStartMinute / 60).toString().padStart(2, "0")}:${(ghostStartMinute % 60).toString().padStart(2, "0")}`)} – {formatTime(`${Math.floor((ghostStartMinute + duration) / 60).toString().padStart(2, "0")}:${((ghostStartMinute + duration) % 60).toString().padStart(2, "0")}`)}
                                </p>
                              )}
                            </div>
                          );
                        })()}

                        {/* Events — with overlap-aware positioning */}
                        {cellEvents.map((event) => {
                          const startH = parseInt(event.startTime.split(":")[0]);
                          const startM = parseInt(event.startTime.split(":")[1]);
                          const endH = parseInt(event.endTime.split(":")[0]);
                          const endM = parseInt(event.endTime.split(":")[1]);
                          const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
                          const heightPx = (durationMinutes / 60) * HOUR_HEIGHT;
                          const topPx = (startM / 60) * HOUR_HEIGHT;
                          const es = EVENT_STYLES[event.color] || EVENT_STYLES.green;

                          const overlap = overlapLayout.get(event.id);
                          const col = overlap?.column ?? 0;
                          const totalCols = overlap?.totalColumns ?? 1;
                          const PAD = 4; // px padding on each side
                          const widthPct = 100 / totalCols;
                          const leftPct = col * widthPct;

                          const isBeingMoved = movingEvent?.id === event.id;

                          return (
                            <div
                              key={event.id}
                              onClick={(e) => { e.stopPropagation(); if (!moveDidDrag) onClickEvent(event, e.clientX, e.clientY); }}
                              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(event, e.clientX, e.clientY); }}
                              onMouseDown={(e) => { if (e.button === 0) handleEventDragStart(event, e); }}
                              className="cal-event absolute z-10"
                              style={{
                                top: `${topPx}px`,
                                height: `${Math.max(heightPx, 22)}px`,
                                left: `calc(${leftPct}% + ${PAD}px)`,
                                width: `calc(${widthPct}% - ${PAD + 2}px)`,
                                background: es.bg,
                                borderLeftColor: es.border,
                                opacity: isBeingMoved ? 0.4 : 1,
                                cursor: "grab",
                              }}
                            >
                              <p className="text-[11px] font-medium truncate leading-tight" style={{ color: es.text }}>{event.title}</p>
                              {heightPx > 34 && (
                                <p className="text-[10px] truncate mt-px" style={{ color: es.text, opacity: 0.7 }}>
                                  {formatTime(event.startTime)} – {formatTime(event.endTime)}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
