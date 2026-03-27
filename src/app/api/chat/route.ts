import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message, events, imageBase64 } = await req.json();

    const eventsContext = events
      .map(
        (e: { id: string; title: string; date: string; startTime: string; endTime: string; color: string }) =>
          `- [id:${e.id}] "${e.title}" on ${e.date} from ${e.startTime} to ${e.endTime} (${e.color})`
      )
      .join("\n");

    const systemPrompt = `You are Kronos, a friendly AI calendar assistant. You help users manage their schedule through natural conversation.

Current calendar events:
${eventsContext || "No events scheduled yet."}

When the user wants to add, modify, or delete events, respond with a JSON block in your message using this format:
\`\`\`json
{"actions": [{"type": "add", "title": "Event Name", "date": "YYYY-MM-DD", "startTime": "HH:MM", "endTime": "HH:MM", "color": "green"}]}
\`\`\`

Available colors: green, blue, orange, red, purple, gray.
For delete actions: {"type": "delete", "id": "event_id"}
For MOVE/RESCHEDULE actions (e.g. "move dinner to 8 PM", "switch gym to morning", "move workout to 6 AM"):
  1. First DELETE the old event using its id
  2. Then ADD a new event with the updated time/date
  Example: {"actions": [{"type": "delete", "id": "old_event_id"}, {"type": "add", "title": "Dinner", "date": "2026-03-25", "startTime": "20:00", "endTime": "21:00", "color": "orange"}]}
For recurring events (like "gym every weekday"), create individual events for the next 2 weeks of weekdays.
Match events by title when the user refers to them casually (e.g. "gym" matches "Morning Gym", "dinner" matches "Dinner").

If the user uploads an image of a schedule, class timetable, calendar screenshot, or any schedule-like content:
1. Carefully analyze the image and extract ALL events, dates, times
2. Create add actions for each event found
3. Use appropriate colors (blue for classes, green for meetings, orange for meals, purple for personal)
4. If dates are relative (like "Monday"), use the upcoming dates from today

Today's date is ${new Date().toISOString().split("T")[0]}.

Keep responses concise and friendly. Use bullet points for listing events. Always include the JSON action block when creating/modifying events — the app parses it automatically. If no action is needed, just respond conversationally without a JSON block.`;

    // Build message content — text only or text + image
    const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

    if (message) {
      userContent.push({ type: "text", text: message || "Please analyze this schedule image and add the events to my calendar." });
    }

    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: imageBase64,
          detail: "high",
        },
      });
      if (!message) {
        userContent.unshift({ type: "text", text: "Please analyze this schedule image and add all events to my calendar." });
      }
    }

    const completion = await openai.chat.completions.create({
      model: imageBase64 ? "gpt-4o" : "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent.length > 0 ? userContent : message },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || "Sorry, I couldn't process that. Try again?";

    return NextResponse.json({ response: responseText });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to process message", details: errorMessage },
      { status: 500 }
    );
  }
}
