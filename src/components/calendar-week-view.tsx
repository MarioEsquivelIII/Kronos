"use client";

import { useState, useRef, useCallback } from "react";
import { CalendarEvent, DAYS_OF_WEEK, DayOfWeek, getCategoryColor } from "@/types";
import { timeToMinutes, minutesToTime, formatTimeDisplay } from "@/utils";

interface CalendarWeekViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onEventUpdate: (id: string, updates: Partial<CalendarEvent>) => void;
}

const HOUR_HEIGHT = 60; // px per hour
const START_HOUR = 6;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;

export default function CalendarWeekView({
  events,
  onEventClick,
  onEventUpdate,
}: CalendarWeekViewProps) {
  const [dragState, setDragState] = useState<{
    eventId: string;
    type: "move" | "resize";
    startY: number;
    startDay: DayOfWeek;
    originalStart: number;
    originalEnd: number;
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  const getEventStyle = useCallback(
    (event: CalendarEvent) => {
      const startMin = timeToMinutes(event.start_time);
      const endMin = timeToMinutes(event.end_time);
      const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
      const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
      const color = getCategoryColor(event.category);

      return {
        top: `${Math.max(0, top)}px`,
        height: `${Math.max(20, height)}px`,
        backgroundColor: `${color}15`,
        borderLeft: `3px solid ${color}`,
        color: color,
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, event: CalendarEvent, type: "move" | "resize") => {
      e.stopPropagation();
      e.preventDefault();
      setDragState({
        eventId: event.id,
        type,
        startY: e.clientY,
        startDay: event.day_of_week,
        originalStart: timeToMinutes(event.start_time),
        originalEnd: timeToMinutes(event.end_time),
      });

      const handleMouseMove = (me: MouseEvent) => {
        if (!gridRef.current) return;
        const deltaY = me.clientY - e.clientY;
        const deltaMinutes = Math.round((deltaY / HOUR_HEIGHT) * 60 / 15) * 15;

        if (type === "move") {
          const newStart = Math.max(
            START_HOUR * 60,
            Math.min(
              END_HOUR * 60 - (timeToMinutes(event.end_time) - timeToMinutes(event.start_time)),
              timeToMinutes(event.start_time) + deltaMinutes
            )
          );
          const duration = timeToMinutes(event.end_time) - timeToMinutes(event.start_time);

          // Detect horizontal day change
          const gridRect = gridRef.current.getBoundingClientRect();
          const dayWidth = (gridRect.width - 60) / 7; // 60px for time column
          const relativeX = me.clientX - gridRect.left - 60;
          const dayIndex = Math.max(0, Math.min(6, Math.floor(relativeX / dayWidth)));
          const newDay = DAYS_OF_WEEK[dayIndex];

          onEventUpdate(event.id, {
            start_time: minutesToTime(newStart),
            end_time: minutesToTime(newStart + duration),
            day_of_week: newDay,
          });
        } else {
          // Resize
          const newEnd = Math.max(
            timeToMinutes(event.start_time) + 15,
            Math.min(END_HOUR * 60, timeToMinutes(event.end_time) + deltaMinutes)
          );
          onEventUpdate(event.id, {
            end_time: minutesToTime(newEnd),
          });
        }
      };

      const handleMouseUp = () => {
        setDragState(null);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [onEventUpdate]
  );

  const eventsByDay = DAYS_OF_WEEK.reduce(
    (acc, day) => {
      acc[day] = events.filter((e) => e.day_of_week === day);
      return acc;
    },
    {} as Record<DayOfWeek, CalendarEvent[]>
  );

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
      {/* Header row */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-100">
        <div className="py-3 px-2" />
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="py-3 px-2 text-center text-xs font-medium text-gray-500 border-l border-gray-50"
          >
            {day.slice(0, 3)}
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-[60px_repeat(7,1fr)] relative calendar-scroll overflow-y-auto"
        style={{ height: `${Math.min(TOTAL_HOURS * HOUR_HEIGHT, 720)}px` }}
      >
        {/* Time labels */}
        <div className="relative">
          {Array.from({ length: TOTAL_HOURS }, (_, i) => i + START_HOUR).map(
            (hour) => (
              <div
                key={hour}
                className="time-slot flex items-start justify-end pr-2 pt-0.5"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="text-[10px] text-gray-400">
                  {formatTimeDisplay(`${hour.toString().padStart(2, "0")}:00`)}
                </span>
              </div>
            )
          )}
        </div>

        {/* Day columns */}
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="relative border-l border-gray-50">
            {/* Hour grid lines */}
            {Array.from({ length: TOTAL_HOURS }, (_, i) => (
              <div
                key={i}
                className="time-slot"
                style={{ height: `${HOUR_HEIGHT}px` }}
              />
            ))}

            {/* Events */}
            {eventsByDay[day].map((event) => {
              const style = getEventStyle(event);
              const isDragging = dragState?.eventId === event.id;
              return (
                <div
                  key={event.id}
                  className={`event-block ${isDragging ? "dragging" : ""}`}
                  style={style}
                  onClick={() => onEventClick(event)}
                  onMouseDown={(e) => handleMouseDown(e, event, "move")}
                >
                  <div className="font-medium text-xs truncate">
                    {event.title}
                  </div>
                  {parseInt(style.height) > 35 && (
                    <div className="text-[10px] opacity-70 truncate">
                      {formatTimeDisplay(event.start_time)} –{" "}
                      {formatTimeDisplay(event.end_time)}
                    </div>
                  )}
                  {/* Resize handle */}
                  <div
                    className="resize-handle"
                    onMouseDown={(e) => handleMouseDown(e, event, "resize")}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
