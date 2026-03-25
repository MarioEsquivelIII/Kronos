"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Calendar } from "@/types";
import PromptInputCard from "@/components/prompt-input-card";
import SavedCalendarsList from "@/components/saved-calendars-list";
import EmptyState from "@/components/empty-state";
import LoadingState from "@/components/loading-state";
import { useToast } from "@/components/toast";

export default function DashboardPage() {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const fetchCalendars = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("calendars")
      .select("*")
      .order("updated_at", { ascending: false });
    setCalendars(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCalendars();
  }, [fetchCalendars]);

  async function handleGenerate(prompt: string) {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate calendar");
      }

      const { calendar } = await res.json();
      showToast("Calendar generated!", "success");
      router.push(`/calendar/${calendar.id}`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Something went wrong",
        "error"
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("calendars").delete().eq("id", id);
    if (error) {
      showToast("Failed to delete calendar", "error");
      return;
    }
    setCalendars((prev) => prev.filter((c) => c.id !== id));
    showToast("Calendar deleted", "info");
  }

  if (loading) return <LoadingState message="Loading your calendars..." />;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Describe your schedule. Fortress builds it.
        </p>
      </div>

      {/* Generate */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Create New Calendar
        </h2>
        <PromptInputCard onGenerate={handleGenerate} loading={generating} />
      </div>

      {/* Saved calendars */}
      {calendars.length > 0 ? (
        <SavedCalendarsList calendars={calendars} onDelete={handleDelete} />
      ) : (
        <EmptyState
          title="No calendars yet"
          description="Describe your ideal weekly schedule above and Fortress will generate a calendar for you."
        />
      )}
    </div>
  );
}
