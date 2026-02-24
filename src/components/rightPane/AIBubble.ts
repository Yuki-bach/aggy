import type { AggResult } from "../../lib/aggregate";
import type { LayoutMeta } from "../../lib/layout";
import { isAIAvailable, generateComment } from "../../lib/aiComment";

export async function showAIBubble(
  results: AggResult[],
  weightCol: string,
  layoutMeta?: LayoutMeta,
): Promise<void> {
  if (!(await isAIAvailable())) return;

  // 既存の吹き出しがあれば除去
  document.querySelector(".ai-bubble")?.remove();

  const bubble = document.createElement("div");
  bubble.className = "ai-bubble";
  bubble.innerHTML = `
    <button class="ai-bubble-close" aria-label="閉じる">\u00d7</button>
    <div class="ai-bubble-header">\u2728 AI\u5206\u6790</div>
    <div class="ai-bubble-body ai-bubble-loading">\u5206\u6790\u4e2d...</div>
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
