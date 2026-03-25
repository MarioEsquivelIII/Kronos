"use client";

import { useState, useEffect } from "react";
import { CalendarEvent, DAYS_OF_WEEK, DayOfWeek } from "@/types";

interface EventEditModalProps {
  event: CalendarEvent | null;
  isNew?: boolean;
  onSave: (event: Partial<CalendarEvent> & { id?: string }) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const CATEGORIES = [
  "Academic", "Work", "Exercise", "Health", "Meal",
  "Social", "Personal", "Rest", "Sleep", "Creative", "Coding", "Study", "Break",
];

export default function EventEditModal({
  event,
  isNew = false,
  onSave,
  onDelete,
  onClose,
}: EventEditModalProps) {
  const [title, setTitle] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [category, setCategory] = useState("Personal");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDayOfWeek(event.day_of_week);
      setStartTime(event.start_time);
      setEndTime(event.end_time);
      setCategory(event.category);
      setDescription(event.description || "");
    }
  }, [event]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...(event?.id ? { id: event.id } : {}),
      title,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      category,
      description: description || null,
      source_type: isNew ? "manual" : event?.source_type || "manual",
    });
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            {isNew ? "Add Event" : "Edit Event"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fortress-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Day
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fortress-500"
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fortress-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fortress-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fortress-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fortress-500"
              placeholder="Brief description"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {!isNew && onDelete && event?.id && (
              <button
                type="button"
                onClick={() => onDelete(event.id)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Delete event
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
              >
                {isNew ? "Add" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
