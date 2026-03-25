"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Calendar, CalendarEvent, DayOfWeek } from "@/types";
import Navbar from "@/components/navbar";
import CalendarWeekView from "@/components/calendar-week-view";
import EventEditModal from "@/components/event-edit-modal";
import RefinePromptPanel from "@/components/refine-prompt-panel";
import LoadingState from "@/components/loading-state";
import { ToastProvider, useToast } from "@/components/toast";

function CalendarEditorInner() {
  const params = useParams();
  const router = useRouter();
  const calendarId = params.id as string;
  const { showToast } = useToast();

  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refining, setRefining] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [titleEdit, setTitleEdit] = useState(false);
  const [title, setTitle] = useState("");

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [calRes, evtRes] = await Promise.all([
      supabase.from("calendars").select("*").eq("id", calendarId).single(),
      supabase
        .from("events")
        .select("*")
        .eq("calendar_id", calendarId)
        .order("start_time"),
    ]);

    if (calRes.error || !calRes.data) {
      showToast("Calendar not found", "error");
      router.push("/dashboard");
      return;
    }

    setCalendar(calRes.data);
    setTitle(calRes.data.title);
    setEvents(evtRes.data || []);
    setLoading(false);
  }, [calendarId, router, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save title
  async function handleTitleSave() {
    setTitleEdit(false);
    if (!title.trim() || title === calendar?.title) return;
    const supabase = createClient();
    await supabase
      .from("calendars")
      .update({ title: title.trim() })
      .eq("id", calendarId);
    setCalendar((prev) => (prev ? { ...prev, title: title.trim() } : prev));
  }

  // Event click -> edit
  function handleEventClick(event: CalendarEvent) {
    setEditingEvent(event);
    setShowNewModal(false);
  }

  // Drag/resize update (optimistic, then persist)
  async function handleEventUpdate(
    id: string,
    updates: Partial<CalendarEvent>
  ) {
    // Optimistic update
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );

    // Persist
    const supabase = createClient();
    await supabase.from("events").update(updates).eq("id", id);
  }

  // Save event from modal
  async function handleSaveEvent(
    eventData: Partial<CalendarEvent> & { id?: string }
  ) {
    const supabase = createClient();

    if (eventData.id) {
      // Update existing
      const { id, ...updates } = eventData;
      await supabase.from("events").update(updates).eq("id", id);
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      );
      showToast("Event updated", "success");
    } else {
      // Create new
      const { data, error } = await supabase
        .from("events")
        .insert({
          calendar_id: calendarId,
          ...eventData,
          source_type: "manual",
        })
        .select()
        .single();

      if (error) {
        showToast("Failed to create event", "error");
        return;
      }
      setEvents((prev) => [...prev, data]);
      showToast("Event added", "success");
    }

    setEditingEvent(null);
    setShowNewModal(false);
  }

  // Delete event
  async function handleDeleteEvent(id: string) {
    const supabase = createClient();
    await supabase.from("events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setEditingEvent(null);
    showToast("Event deleted", "info");
  }

  // Refine
  async function handleRefine(prompt: string) {
    setRefining(true);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendar_id: calendarId, prompt }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Refinement failed");
      }

      const { events: newEvents } = await res.json();
      setEvents(newEvents);
      showToast("Calendar refined!", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Refinement failed",
        "error"
      );
    } finally {
      setRefining(false);
    }
  }

  // Save all (update timestamp)
  async function handleSaveAll() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("calendars")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", calendarId);
    setSaving(false);
    showToast("Calendar saved", "success");
  }

  if (loading) return <LoadingState message="Loading calendar..." />;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            {titleEdit ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                autoFocus
                className="text-xl font-bold text-gray-900 border-b-2 border-fortress-500 outline-none bg-transparent"
              />
            ) : (
              <h1
                onClick={() => setTitleEdit(true)}
                className="text-xl font-bold text-gray-900 cursor-pointer hover:text-fortress-600"
              >
                {calendar?.title || "Untitled"}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewModal(true)}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              + Add Event
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Calendar */}
          <div>
            {refining && (
              <div className="mb-4 bg-fortress-50 text-fortress-700 text-sm px-4 py-3 rounded-lg animate-pulse-soft">
                Refining your schedule...
              </div>
            )}
            <CalendarWeekView
              events={events}
              onEventClick={handleEventClick}
              onEventUpdate={handleEventUpdate}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <RefinePromptPanel onRefine={handleRefine} loading={refining} />

            {/* Stats */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Overview
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Total events</span>
                  <span className="font-medium">{events.length}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>AI generated</span>
                  <span className="font-medium">
                    {events.filter((e) => e.source_type === "ai").length}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Manual</span>
                  <span className="font-medium">
                    {events.filter((e) => e.source_type === "manual").length}
                  </span>
                </div>
              </div>

              {/* Category breakdown */}
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-400 mb-2">Categories</p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(new Set(events.map((e) => e.category))).map(
                    (cat) => (
                      <span
                        key={cat}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-600"
                      >
                        {cat} (
                        {events.filter((e) => e.category === cat).length})
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editingEvent && (
        <EventEditModal
          event={editingEvent}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}

      {/* New event modal */}
      {showNewModal && (
        <EventEditModal
          event={{
            id: "",
            calendar_id: calendarId,
            title: "",
            day_of_week: "Monday" as DayOfWeek,
            start_time: "09:00",
            end_time: "10:00",
            category: "Personal",
            description: null,
            source_type: "manual",
            created_at: "",
            updated_at: "",
          }}
          isNew
          onSave={handleSaveEvent}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  );
}

export default function CalendarEditorPage() {
  return (
    <ToastProvider>
      <CalendarEditorInner />
    </ToastProvider>
  );
}
