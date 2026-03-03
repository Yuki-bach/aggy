import type { Question } from "../../lib/agg/types";

interface CrossConfigProps {
  questions: Question[];
  crossSelected: Record<string, boolean>;
  onToggle: (key: string, checked: boolean) => void;
}

export default function CrossConfig({ questions, crossSelected, onToggle }: CrossConfigProps) {
  return (
    <>
      {questions.map((q) => {
        const typeTag = q.type === "MA" ? " [MA]" : "";
        const hasLabel = q.label !== q.code;
        const displayText = hasLabel ? `${q.code}: ${q.label}${typeTag}` : `${q.code}${typeTag}`;

        return (
          <label
            key={q.code}
            class="flex min-h-9 cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-surface2"
          >
            <input
              type="checkbox"
              class="size-[18px] cursor-pointer accent-accent"
              checked={crossSelected[q.code] ?? false}
              onChange={(e) => {
                onToggle(q.code, (e.target as HTMLInputElement).checked);
              }}
            />{" "}
            {displayText}
          </label>
        );
      })}
    </>
  );
}
