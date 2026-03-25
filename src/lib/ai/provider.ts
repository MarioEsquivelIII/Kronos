import { generateWithOpenAI } from "./openai";
import { generateWithAnthropic } from "./anthropic";
import { SYSTEM_PROMPT, buildGeneratePrompt, buildRefinePrompt } from "./prompts";
import { normalizeAIEvents } from "@/lib/validation";
import { extractJSON } from "@/utils";
import { CalendarEventInput } from "@/types";

export type AIProvider = "openai" | "anthropic";

function getProvider(): AIProvider {
  return (process.env.AI_PROVIDER as AIProvider) || "openai";
}

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const provider = getProvider();
  if (provider === "anthropic") {
    return generateWithAnthropic(systemPrompt, userPrompt);
  }
  return generateWithOpenAI(systemPrompt, userPrompt);
}

export async function generateCalendarEvents(
  userPrompt: string
): Promise<{ events: CalendarEventInput[]; warning?: string }> {
  const prompt = buildGeneratePrompt(userPrompt);
  const rawResponse = await callAI(SYSTEM_PROMPT, prompt);

  const jsonArray = extractJSON(rawResponse);
  if (!jsonArray) {
    throw new Error("The AI returned an invalid response. Please try again.");
  }

  const events = normalizeAIEvents(jsonArray);
  if (!events) {
    throw new Error("Could not parse the generated schedule. Please try rephrasing.");
  }

  return { events };
}

export async function refineCalendarEvents(
  currentEvents: CalendarEventInput[],
  refinement: string
): Promise<{ events: CalendarEventInput[]; warning?: string }> {
  const prompt = buildRefinePrompt(currentEvents, refinement);
  const rawResponse = await callAI(SYSTEM_PROMPT, prompt);

  const jsonArray = extractJSON(rawResponse);
  if (!jsonArray) {
    throw new Error("The AI returned an invalid response during refinement. Please try again.");
  }

  const events = normalizeAIEvents(jsonArray);
  if (!events) {
    throw new Error("Could not parse the refined schedule. Please try rephrasing.");
  }

  return { events };
}
