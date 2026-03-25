import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { manualEventSchema } from "@/lib/validation";

// POST /api/events — create manual event
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = manualEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  // Verify calendar ownership
  const { data: calendar } = await supabase
    .from("calendars")
    .select("id")
    .eq("id", parsed.data.calendar_id)
    .eq("user_id", user.id)
    .single();

  if (!calendar) {
    return NextResponse.json(
      { error: "Calendar not found" },
      { status: 404 }
    );
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      ...parsed.data,
      source_type: "manual",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }

  return NextResponse.json({ event: data }, { status: 201 });
}
