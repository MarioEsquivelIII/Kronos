"use client";

import Link from "next/link";
import { Calendar } from "@/types";

interface SavedCalendarsListProps {
  calendars: Calendar[];
  onDelete: (id: string) => void;
}

export default function SavedCalendarsList({
  calendars,
  onDelete,
}: SavedCalendarsListProps) {
  if (calendars.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Your Calendars
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {calendars.map((cal) => (
          <div
            key={cal.id}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-medium text-gray-900 text-sm truncate pr-2">
                {cal.title}
              </h3>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (confirm("Delete this calendar?")) onDelete(cal.id);
                }}
                className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            {cal.description && (
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                {cal.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {new Date(cal.updated_at).toLocaleDateString()}
              </span>
              <Link
                href={`/calendar/${cal.id}`}
                className="text-xs text-fortress-600 hover:text-fortress-700 font-medium"
              >
                Open &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
