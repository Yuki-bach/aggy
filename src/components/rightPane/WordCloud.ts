/** FA word cloud card rendering */

import type { FAResult } from "../../lib/aggregate";
import type { LayoutMeta } from "../../lib/layout";
import { resolveQuestionLabel } from "../../lib/labelResolver";
import { escHtml } from "../shared/escHtml";
import WordCloud from "wordcloud2/src/wordcloud2.js";

/** Resolve word cloud color palette from CSS variables */
function resolveColors(): string[] {
  const vars = [
    "--color-primary-700",
    "--color-primary-600",
    "--color-primary-500",
    "--color-secondary-700",
    "--color-secondary-500",
  ];
  const style = getComputedStyle(document.documentElement);
  const resolved = vars
    .map((v) => style.getPropertyValue(v).trim())
    .filter((c) => c.length > 0);
  return resolved.length > 0 ? resolved : ["#003894", "#005bb5", "#4a90d9", "#00796b", "#26a69a"];
}

export function buildWordCloudCard(
  result: FAResult,
  layoutMeta?: LayoutMeta,
): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "gt-table-card fa-card";

  const questionLabel = resolveQuestionLabel(result.question, layoutMeta);
  const hasLabel = questionLabel !== result.question;

  card.innerHTML = `
    <div class="gt-table-head">
      <div class="q-header">
        <span class="q-label">${escHtml(questionLabel)}</span>
        ${hasLabel ? `<span class="q-key">${escHtml(result.question)}</span>` : ""}
      </div>
      <span class="q-type">FA</span>
      <span class="q-n">回答数: ${result.totalResponses.toLocaleString()}</span>
    </div>
  `;

  // Word cloud canvas
  const canvasWrap = document.createElement("div");
  canvasWrap.className = "wordcloud-container";

  if (result.words.length === 0) {
    canvasWrap.innerHTML = '<p class="wordcloud-empty">テキストデータがありません</p>';
    card.appendChild(canvasWrap);
    return card;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 400;
  canvas.className = "wordcloud-canvas";
  canvasWrap.appendChild(canvas);
  card.appendChild(canvasWrap);

  // Render after DOM insertion (wordcloud2 requires visible canvas)
  requestAnimationFrame(() => {
    const colors = resolveColors();
    const maxCount = result.words[0].count;
    const list: [string, number][] = result.words.map((w) => [w.word, w.count]);

    WordCloud(canvas, {
      list,
      gridSize: 8,
      weightFactor: (size: number) => (size / maxCount) * 48 + 12,
      fontFamily: "system-ui, sans-serif",
      color: () => colors[Math.floor(Math.random() * colors.length)],
      rotateRatio: 0.3,
      minRotation: -Math.PI / 6,
      maxRotation: Math.PI / 6,
      backgroundColor: "transparent",
      shrinkToFit: true,
    });
  });

  // Collapsible frequency table
  const details = document.createElement("details");
  details.className = "fa-freq-details";
  const summary = document.createElement("summary");
  summary.textContent = `単語頻度一覧（上位${result.words.length}語）`;
  details.appendChild(summary);
  details.appendChild(buildFreqTable(result));
  card.appendChild(details);

  return card;
}

function buildFreqTable(result: FAResult): HTMLTableElement {
  const table = document.createElement("table");
  table.className = "gt fa-freq-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>順位</th>
        <th>単語</th>
        <th class="right">出現回数</th>
      </tr>
    </thead>
  `;
  const tbody = document.createElement("tbody");
  result.words.forEach((w, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="num">${i + 1}</td>
      <td>${escHtml(w.word)}</td>
      <td class="num">${w.count.toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}
