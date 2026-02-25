import type { AggResult } from "../../lib/aggregate";
import type { LayoutMeta } from "../../lib/layout";
import { isAIAvailable, generateComment } from "../../lib/aiComment";
import { t } from "../../lib/i18n";

export async function showAIBubble(
  results: AggResult[],
  weightCol: string,
  layoutMeta?: LayoutMeta,
): Promise<void> {
  if (!(await isAIAvailable())) return;

  // Remove existing bubble if any
  document.querySelector(".ai-bubble")?.remove();

  const bubble = document.createElement("div");
  bubble.className = "ai-bubble";
  bubble.innerHTML = `
    <button class="ai-bubble-close" aria-label="${t("ai.close")}">\u00d7</button>
    <div class="ai-bubble-header">${t("ai.header")}</div>
    <div class="ai-bubble-body ai-bubble-loading">${t("ai.loading")}</div>
  `;
  document.body.appendChild(bubble);

  bubble.querySelector(".ai-bubble-close")!.addEventListener("click", () => bubble.remove());

  const comment = await generateComment(results, weightCol, layoutMeta);
  if (comment) {
    const body = bubble.querySelector(".ai-bubble-body")!;
    body.textContent = comment;
    body.classList.remove("ai-bubble-loading");
  } else {
    bubble.remove();
  }
}
