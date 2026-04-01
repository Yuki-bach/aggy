import { describe, it, expect } from "vite-plus/test";
import { detectAttributes, type DetectInput } from "../src/lib/detectAttributes";

function makeInput(
  code: string,
  label: string,
  choices: { value: string; label: string }[],
): DetectInput {
  return {
    code,
    label,
    labels: Object.fromEntries(choices.map((c) => [c.value, c.label])),
  };
}

describe("detectAttributes", () => {
  describe("positive detection (attribute questions)", () => {
    it("Q1: gender (ja) — keyword + choice set", () => {
      const result = detectAttributes([
        makeInput("Q1", "あなたの性別を教えてください。", [
          { value: "1", label: "男性" },
          { value: "2", label: "女性" },
          { value: "3", label: "その他" },
        ]),
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("Q1");
      expect(result[0].category).toBe("gender");
    });

    it("Q2: age (ja) — keyword + choice set + choice pattern", () => {
      const result = detectAttributes([
        makeInput("Q2", "あなたの年代をお選びください。", [
          { value: "1", label: "10代以下" },
          { value: "2", label: "20代" },
          { value: "3", label: "30代" },
          { value: "4", label: "40代" },
          { value: "5", label: "50代" },
          { value: "6", label: "60代以上" },
        ]),
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("Q2");
      expect(result[0].category).toBe("age");
    });

    it("Q3: location (ja) — keyword + choice set", () => {
      const result = detectAttributes([
        makeInput("Q3", "お住まいの地域をお選びください。", [
          { value: "1", label: "北海道" },
          { value: "2", label: "東北" },
          { value: "3", label: "関東" },
          { value: "4", label: "中部" },
          { value: "5", label: "近畿" },
          { value: "6", label: "中国" },
          { value: "7", label: "四国" },
          { value: "8", label: "九州" },
          { value: "9", label: "沖縄" },
        ]),
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("Q3");
      expect(result[0].category).toBe("location");
    });

    it("Q4: occupation (ja) — keyword + choice set", () => {
      const result = detectAttributes([
        makeInput("Q4", "あなたの職業をお選びください。", [
          { value: "1", label: "会社員" },
          { value: "2", label: "公務員" },
          { value: "3", label: "自営業" },
          { value: "4", label: "パート・アルバイト" },
          { value: "5", label: "学生" },
          { value: "6", label: "無職" },
        ]),
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("Q4");
      expect(result[0].category).toBe("occupation");
    });

    it("Q5: income (ja) — keyword + choice pattern", () => {
      const result = detectAttributes([
        makeInput("Q5", "世帯年収をお選びください。", [
          { value: "1", label: "200万円未満" },
          { value: "2", label: "200万円〜400万円未満" },
          { value: "3", label: "400万円〜600万円未満" },
          { value: "4", label: "600万円〜800万円未満" },
          { value: "5", label: "800万円以上" },
        ]),
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("Q5");
      expect(result[0].category).toBe("income");
    });

    it("Q6: education (ja) — keyword + choice set", () => {
      const result = detectAttributes([
        makeInput("Q6", "最終学歴をお答えください。", [
          { value: "1", label: "中学校卒" },
          { value: "2", label: "高校卒" },
          { value: "3", label: "専門学校卒" },
          { value: "4", label: "大学卒" },
          { value: "5", label: "大学院卒" },
        ]),
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("Q6");
      expect(result[0].category).toBe("education");
    });

    it("Q7: gender (en) — keyword + choice set", () => {
      const result = detectAttributes([
        makeInput("Q7", "What is your gender?", [
          { value: "1", label: "Male" },
          { value: "2", label: "Female" },
          { value: "3", label: "Other" },
        ]),
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("Q7");
      expect(result[0].category).toBe("gender");
    });

    it("Q8: age (en) — keyword + choice set", () => {
      const result = detectAttributes([
        makeInput("Q8", "What is your age group?", [
          { value: "1", label: "Under 18" },
          { value: "2", label: "18-24" },
          { value: "3", label: "25-34" },
          { value: "4", label: "35-44" },
          { value: "5", label: "45-54" },
          { value: "6", label: "55-64" },
          { value: "7", label: "65+" },
        ]),
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("Q8");
      expect(result[0].category).toBe("age");
    });

    it("Q9: age by choice pattern only (no keyword)", () => {
      const result = detectAttributes([
        makeInput("Q9", "あなたはどのステージですか？", [
          { value: "1", label: "18〜24歳" },
          { value: "2", label: "25〜34歳" },
          { value: "3", label: "35〜44歳" },
          { value: "4", label: "45〜54歳" },
          { value: "5", label: "55歳以上" },
        ]),
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("Q9");
      expect(result[0].category).toBe("age");
    });

    it("Q10: marital_status (ja) — keyword + choice set", () => {
      const result = detectAttributes([
        makeInput("Q10", "結婚していますか？", [
          { value: "1", label: "未婚" },
          { value: "2", label: "既婚" },
          { value: "3", label: "離別" },
          { value: "4", label: "死別" },
        ]),
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("Q10");
      expect(result[0].category).toBe("marital_status");
    });
  });

  describe("negative detection (non-attribute questions)", () => {
    const nonAttributes: DetectInput[] = [
      makeInput("Q20", "この製品をどの程度満足していますか？", [
        { value: "1", label: "非常に満足" },
        { value: "2", label: "やや満足" },
        { value: "3", label: "普通" },
        { value: "4", label: "やや不満" },
        { value: "5", label: "非常に不満" },
      ]),
      makeInput("Q21", "この商品を友人に勧めますか？", [
        { value: "1", label: "はい" },
        { value: "2", label: "いいえ" },
        { value: "3", label: "わからない" },
      ]),
      makeInput("Q22", "どの機能を最も重視しますか？", [
        { value: "1", label: "価格" },
        { value: "2", label: "デザイン" },
        { value: "3", label: "機能性" },
        { value: "4", label: "ブランド" },
      ]),
      makeInput("Q23", "How often do you use this product?", [
        { value: "1", label: "Daily" },
        { value: "2", label: "Weekly" },
        { value: "3", label: "Monthly" },
        { value: "4", label: "Rarely" },
      ]),
      makeInput("Q24", "購入のきっかけは何ですか？", [
        { value: "1", label: "テレビCM" },
        { value: "2", label: "ネット広告" },
        { value: "3", label: "口コミ" },
        { value: "4", label: "店頭で見た" },
      ]),
    ];

    for (const input of nonAttributes) {
      it(`${input.code}: "${input.label}" → not detected`, () => {
        const result = detectAttributes([input]);
        expect(result).toHaveLength(0);
      });
    }
  });

  describe("sorting by match count", () => {
    it("questions with more matches rank higher", () => {
      const result = detectAttributes([
        // keyword only
        makeInput("Q_kw", "性別について", [
          { value: "1", label: "選択肢A" },
          { value: "2", label: "選択肢B" },
        ]),
        // keyword + choice set + choice pattern
        makeInput("Q_all", "あなたの年代をお選びください。", [
          { value: "1", label: "20代" },
          { value: "2", label: "30代" },
          { value: "3", label: "40代" },
          { value: "4", label: "50代" },
        ]),
      ]);
      expect(result.length).toBeGreaterThanOrEqual(2);
      // Q_all should rank before Q_kw (more matches)
      const idxAll = result.findIndex((r) => r.code === "Q_all");
      const idxKw = result.findIndex((r) => r.code === "Q_kw");
      expect(idxAll).toBeLessThan(idxKw);
    });
  });
});
