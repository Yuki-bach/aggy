import { useState, useEffect } from "preact/hooks";
import type { Tab } from "../../lib/agg/types";
import { generateComment } from "../../lib/aiComment";
import { t } from "../../lib/i18n";
import { isAICommentEnabled } from "../header/SettingsModal";
import { IconButton } from "../shared/IconButton";

interface AIBubbleProps {
  tabs: Tab[];
  weightCol: string;
}

export function AIBubble({ tabs, weightCol }: AIBubbleProps) {
  const [comment, setComment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!isAICommentEnabled()) {
      setVisible(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setComment(null);
    setVisible(true);
    void generateComment(tabs, weightCol).then((c) => {
      if (cancelled) return;
      if (c) {
        setComment(c);
        setLoading(false);
      } else {
        setVisible(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tabs, weightCol]);

  if (!visible) return null;

  return (
    <div class="fixed bottom-6 right-6 z-100 min-w-[280px] max-w-[380px] rounded-2xl border border-border bg-surface px-5 py-4 shadow-lg animate-[bubbleIn_0.3s_ease-out]">
      {/* Triangle pointer */}
      <div
        class="absolute -bottom-2 right-6 h-0 w-0"
        style="border-left:8px solid transparent;border-right:8px solid transparent;border-top:8px solid var(--surface)"
      />
      <div class="absolute top-2 right-3">
        <IconButton size="lg" aria-label={t("ai.close")} onClick={() => setVisible(false)}>
          {"\u00d7"}
        </IconButton>
      </div>
      <div class="mb-3 text-sm font-bold text-accent2">{t("ai.header")}</div>
      <div
        class={`whitespace-pre-wrap text-sm leading-relaxed text-text${loading ? " text-muted animate-[pulse_1.2s_ease-in-out_infinite]" : ""}`}
      >
        {loading ? t("ai.loading") : comment}
      </div>
    </div>
  );
}
