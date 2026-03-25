"use client";

import { useState } from "react";

interface RefinePromptPanelProps {
  onRefine: (prompt: string) => void;
  loading?: boolean;
}

const SUGGESTIONS = [
  "Make Fridays lighter",
  "Move workouts to mornings",
  "Add lunch at noon every weekday",
  "Add 30 min breaks between blocks",
  "Keep weekends mostly free",
];

export default function RefinePromptPanel({
  onRefine,
  loading = false,
}: RefinePromptPanelProps) {
  const [prompt, setPrompt] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    onRefine(prompt.trim());
    setPrompt("");
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Refine Schedule
      </h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type a refinement, e.g. 'Move workouts to evenings' or 'Add 1 hour of coding every Tuesday'"
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-fortress-500 placeholder:text-gray-400"
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.slice(0, 3).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setPrompt(s)}
                className="text-[11px] text-gray-400 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded-full transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className="bg-fortress-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-fortress-700 transition-colors disabled:opacity-50 whitespace-nowrap ml-2"
          >
            {loading ? "Refining..." : "Refine"}
          </button>
        </div>
      </form>
    </div>
  );
}
