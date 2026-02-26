import { questionKey, type QuestionDef } from "../../lib/agg/aggregate";

interface CrossConfigProps {
  questions: QuestionDef[];
  questionLabels: Record<string, string>;
  crossSelected: Record<string, boolean>;
  onToggle: (key: string, checked: boolean) => void;
}

export default function CrossConfig({
  questions,
  questionLabels,
  crossSelected,
  onToggle,
}: CrossConfigProps) {
  return (
    <>
      {questions.map((q) => {
        const key = questionKey(q);
        const qLabel = questionLabels[key];
        const typeTag = q.type === "MA" ? " [MA]" : "";
        const displayText = qLabel ? `${key}: ${qLabel}${typeTag}` : `${key}${typeTag}`;

        return (
          <label
            key={key}
            class="flex min-h-9 cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-[0.875rem] transition-[background] duration-100 hover:bg-surface2"
          >
            <input
              type="checkbox"
              class="h-[18px] w-[18px] cursor-pointer accent-accent"
              checked={crossSelected[key] ?? false}
              onChange={(e) => {
                onToggle(key, (e.target as HTMLInputElement).checked);
              }}
            />{" "}
            {displayText}
          </label>
        );
      })}
    </>
  );
}
