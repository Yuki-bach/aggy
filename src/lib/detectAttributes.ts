import { ATTRIBUTE_RULES, type CategoryRule } from "./attributeRules";

export interface DetectInput {
  code: string;
  label: string;
  labels: Record<string, string>;
}

export interface AttributeResult {
  code: string;
  category: string;
}

/** Normalize text for comparison: lowercase, remove spaces/brackets/punctuation */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[\s　]+/g, "")
    .replaceAll(/[（）()「」【】[\]]/g, "")
    .replaceAll(/[・、。,.\-－―～〜]/g, "");
}

function matchKeyword(label: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(label));
}

function matchChoiceSet(
  choiceLabels: string[],
  templates: CategoryRule["choiceTemplates"],
): boolean {
  if (templates.length === 0 || choiceLabels.length === 0) return false;
  const normalizedChoices = choiceLabels.map(normalize);

  return templates.some((tmpl) => {
    const normalizedTmpl = tmpl.labels.map(normalize);
    let matched = 0;
    for (const choice of normalizedChoices) {
      if (normalizedTmpl.some((t) => choice.includes(t) || t.includes(choice))) {
        matched++;
      }
    }
    return matched / choiceLabels.length >= tmpl.threshold;
  });
}

function matchChoicePattern(
  choiceLabels: string[],
  patterns: CategoryRule["choicePatterns"],
): boolean {
  if (patterns.length === 0 || choiceLabels.length === 0) return false;

  return patterns.some((cp) => {
    let matched = 0;
    for (const label of choiceLabels) {
      if (cp.pattern.test(label)) matched++;
    }
    return matched / choiceLabels.length >= cp.threshold;
  });
}

export function detectAttributes(inputs: DetectInput[]): AttributeResult[] {
  const results: { code: string; category: string; matchCount: number }[] = [];

  for (const input of inputs) {
    const choiceLabels = Object.values(input.labels);
    let bestCategory = "";
    let bestCount = 0;

    for (const rule of ATTRIBUTE_RULES) {
      let count = 0;
      if (matchKeyword(input.label, rule.keywordPatterns)) count++;
      if (matchChoiceSet(choiceLabels, rule.choiceTemplates)) count++;
      if (matchChoicePattern(choiceLabels, rule.choicePatterns)) count++;

      if (count > bestCount) {
        bestCount = count;
        bestCategory = rule.id;
      }
    }

    if (bestCount > 0) {
      results.push({ code: input.code, category: bestCategory, matchCount: bestCount });
    }
  }

  results.sort((a, b) => b.matchCount - a.matchCount);
  return results.map(({ code, category }) => ({ code, category }));
}
