"use client";

import { useState } from "react";
import ExamplePrompts from "./example-prompts";

interface PromptInputCardProps {
  onGenerate: (prompt: string) => void;
  loading?: boolean;
  placeholder?: string;
  buttonText?: string;
  showExamples?: boolean;
}

export default function PromptInputCard({
  onGenerate,
  loading = false,
  placeholder = "Describe the schedule you want. Include fixed events, goals, time preferences, routines, and anything you want prioritized.",
  buttonText = "Generate Calendar",
  showExamples = true,
}: PromptInputCardProps) {
  const [prompt, setPrompt] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    onGenerate(prompt.trim());
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-fortress-500 focus:border-transparent placeholder:text-gray-400"
        />
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-gray-400">
            {prompt.length > 0 && `${prompt.length} characters`}
          </div>
          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generating...
              </span>
            ) : (
              buttonText
            )}
          </button>
        </div>
      </form>
      {showExamples && (
        <div className="mt-4 pt-4 border-t border-gray-50">
          <p className="text-xs text-gray-400 mb-2">Try an example:</p>
          <ExamplePrompts onSelect={setPrompt} />
        </div>
      )}
    </div>
  );
}
