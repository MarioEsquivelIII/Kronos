import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refineCalendarEvents } from "@/lib/ai/provider";
import { refineRequestSchema } from "@/lib/validation";
import { CalendarEventInput } from "@/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = refineRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { calendar_id, prompt } = parsed.data;

    // Verify ownership
    const { data: calendar } = await supabase
      .from("calendars")
      .select("id")
      .eq("id", calendar_id)
      .eq("user_id", user.id)
      .single();

    if (!calendar) {
      return NextResponse.json(
        { error: "Calendar not found" },
        { status: 404 }
      );
    }

    // Get current events
    const { data: currentEvents } = await supabase
      .from("events")
      .select("*")
      .eq("calendar_id", calendar_id);

    const currentAsInput: CalendarEventInput[] = (currentEvents || []).map(
      (e) => ({
        title: e.title,
        day_of_week: e.day_of_week,
        start_time: e.start_time,
        end_time: e.end_time,
        category: e.category,
        description: e.description,
        source_type: e.source_type as "ai" | "manual",
      })
    );

    // Refine via AI
    const { events: refinedEvents, warning } =
      await refineCalendarEvents(currentAsInput, prompt);

    // Replace all events
    await supabase.from("events").delete().eq("calendar_id", calendar_id);

    const eventsToInsert = refinedEvents.map((e) => ({
      calendar_id,
      title: e.title,
      day_of_week: e.day_of_week,
      start_time: e.start_time,
      end_time: e.end_time,
      category: e.category,
      description: e.description,
      source_type: "ai" as const,
    }));

    const { data: newEvents, error: insertError } = await supabase
      .from("events")
      .insert(eventsToInsert)
      .select();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to save refined events" },
        { status: 500 }
      );
    }

    // Store revision
    await supabase.from("revisions").insert({
      calendar_id,
      prompt_used: prompt,
      model_response_json: refinedEvents,
    });

    // Update calendar timestamp
    await supabase
      .from("calendars")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", calendar_id);

    return NextResponse.json({ events: newEvents, warning });
  } catch (err) {
    console.error("Refine error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to refine calendar",
      },
      { status: 500 }
    );
  }
}
