import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCalendarEvents } from "@/lib/ai/provider";
import { generateRequestSchema } from "@/lib/validation";

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
    const parsed = generateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { prompt, title } = parsed.data;

    // Generate events from AI
    const { events, warning } = await generateCalendarEvents(prompt);

    // Create calendar
    const { data: calendar, error: calError } = await supabase
      .from("calendars")
      .insert({
        user_id: user.id,
        title: title || generateTitle(prompt),
        description: prompt,
      })
      .select()
      .single();

    if (calError || !calendar) {
      return NextResponse.json(
        { error: "Failed to create calendar" },
        { status: 500 }
      );
    }

    // Insert events
    const eventsToInsert = events.map((e) => ({
      calendar_id: calendar.id,
      title: e.title,
      day_of_week: e.day_of_week,
      start_time: e.start_time,
      end_time: e.end_time,
      category: e.category,
      description: e.description,
      source_type: "ai" as const,
    }));

    const { error: evtError } = await supabase
      .from("events")
      .insert(eventsToInsert);

    if (evtError) {
      // Clean up calendar if events fail
      await supabase.from("calendars").delete().eq("id", calendar.id);
      return NextResponse.json(
        { error: "Failed to save events" },
        { status: 500 }
      );
    }

    // Store revision
    await supabase.from("revisions").insert({
      calendar_id: calendar.id,
      prompt_used: prompt,
      model_response_json: events,
    });

    return NextResponse.json({ calendar, warning });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to generate calendar",
      },
      { status: 500 }
    );
  }
}

function generateTitle(prompt: string): string {
  const words = prompt.split(" ").slice(0, 5).join(" ");
  return words.length > 40 ? words.slice(0, 40) + "..." : words;
}
