"use client";

import { useEffect, useRef } from "react";
import { CalendarEvent, formatTime } from "@/lib/events";

interface EventContextMenuProps {
  event: CalendarEvent;
  x: number;
  y: number;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (event: CalendarEvent) => void;
}

export default function EventContextMenu({ event, x, y, onClose, onDelete, onEdit }: EventContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 200);

  return (
    <div
      ref={ref}
      className="fixed z-[100] w-52 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
      style={{ left: adjustedX, top: adjustedY, background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}
    >
      {/* Event info header */}
      <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-color)" }}>
        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{event.title}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {formatTime(event.startTime)} – {formatTime(event.endTime)}
        </p>
      </div>

      {/* Actions */}
      <div className="py-1">
        <button
          onClick={() => {
            onEdit(event);
            onClose();
          }}
          className="w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 transition-colors"
          style={{ color: "var(--text-primary)" }}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit event
        </button>
        <button
          onClick={() => {
            onDelete(event.id);
            onClose();
          }}
          className="w-full px-3 py-2 text-left text-sm text-[#e87171] hover:bg-[#332929] flex items-center gap-2.5 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
          Delete event
        </button>
      </div>
    </div>
  );
}
