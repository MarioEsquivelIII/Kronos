import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/calendars — list user's calendars
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("calendars")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch calendars" }, { status: 500 });
  }

  return NextResponse.json({ calendars: data });
}

// POST /api/calendars — create empty calendar
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description } = await request.json();

  const { data, error } = await supabase
    .from("calendars")
    .insert({
      user_id: user.id,
      title: title || "Untitled Calendar",
      description: description || "",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create calendar" }, { status: 500 });
  }

  return NextResponse.json({ calendar: data }, { status: 201 });
}
