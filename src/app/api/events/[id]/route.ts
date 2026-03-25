import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/events/:id — update event
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates = await request.json();

  // Verify ownership via calendar join
  const { data: event } = await supabase
    .from("events")
    .select("calendar_id")
    .eq("id", id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { data: calendar } = await supabase
    .from("calendars")
    .select("id")
    .eq("id", event.calendar_id)
    .eq("user_id", user.id)
    .single();

  if (!calendar) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }

  return NextResponse.json({ event: data });
}

// DELETE /api/events/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: event } = await supabase
    .from("events")
    .select("calendar_id")
    .eq("id", id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { data: calendar } = await supabase
    .from("calendars")
    .select("id")
    .eq("id", event.calendar_id)
    .eq("user_id", user.id)
    .single();

  if (!calendar) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
