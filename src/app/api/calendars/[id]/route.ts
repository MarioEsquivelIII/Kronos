import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/calendars/:id
export async function GET(
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

  const { data: calendar, error } = await supabase
    .from("calendars")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !calendar) {
    return NextResponse.json({ error: "Calendar not found" }, { status: 404 });
  }

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("calendar_id", id)
    .order("start_time");

  return NextResponse.json({ calendar: { ...calendar, events: events || [] } });
}

// PATCH /api/calendars/:id
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

  const { data, error } = await supabase
    .from("calendars")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ calendar: data });
}

// DELETE /api/calendars/:id
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

  const { error } = await supabase
    .from("calendars")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
