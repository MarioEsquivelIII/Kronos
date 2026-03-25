"use client";

const EXAMPLES = [
  "Weekly college schedule: classes Mon/Wed 10-2, study 2hrs daily, gym 4x/week, sleep by midnight",
  "Weekday routine: wake at 7, work 9-5, interview prep evenings, gym mornings",
  "Balanced weekly plan: coding practice, gym, 3 meals, study blocks, free weekends",
];

interface ExamplePromptsProps {
  onSelect: (prompt: string) => void;
}

export default function ExamplePrompts({ onSelect }: ExamplePromptsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXAMPLES.map((ex, i) => (
        <button
          key={i}
          onClick={() => onSelect(ex)}
          className="text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-100 px-3 py-1.5 rounded-full transition-colors text-left"
        >
          {ex}
        </button>
      ))}
    </div>
  );
}
