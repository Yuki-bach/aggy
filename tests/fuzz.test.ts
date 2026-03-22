import { describe, it, expect, beforeAll, afterAll } from "vite-plus/test";
import { Rng } from "./helpers/generators";
import { fuzzJsonText, fuzzLayoutArray, fuzzRawData } from "./helpers/fuzzGenerators";
import { parseLayoutJson, validateLayoutStructure, buildValidLayout } from "../src/lib/layout";
import { validateRawData } from "../src/lib/validateRawData";
import { setupDuckDB, teardownDuckDB, getConn, loadCSV } from "./helpers/duckdb";

const FUZZ_SEEDS = 200;

// ── Layout JSON parsing fuzz ────────────────────────────────────────

describe("fuzz - parseLayoutJson", () => {
  for (let seed = 1; seed <= FUZZ_SEEDS; seed++) {
    it(`seed=${seed}`, () => {
      const rng = new Rng(seed);
      const text = fuzzJsonText(rng);
      try {
        const arr = parseLayoutJson(text);
        // パースできた場合は validate / build も通す
        const diags = validateLayoutStructure(arr);
        expect(Array.isArray(diags)).toBe(true);
        const layout = buildValidLayout(arr);
        expect(Array.isArray(layout)).toBe(true);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
    });
  }
});

// ── Layout structure validation fuzz ────────────────────────────────

describe("fuzz - validateLayoutStructure", () => {
  for (let seed = 1; seed <= FUZZ_SEEDS; seed++) {
    it(`seed=${seed}`, () => {
      const rng = new Rng(seed);
      const arr = fuzzLayoutArray(rng);
      // throw しないこと
      const diags = validateLayoutStructure(arr);
      expect(Array.isArray(diags)).toBe(true);
      for (const d of diags) {
        expect(d.severity).toBe("error");
        expect(d.type).toBe("invalidLayout");
      }
      const layout = buildValidLayout(arr);
      expect(Array.isArray(layout)).toBe(true);
    });
  }
});

// ── Raw data validation fuzz ────────────────────────────────────────

describe("fuzz - validateRawData", () => {
  beforeAll(async () => {
    await setupDuckDB();
  }, 30_000);

  afterAll(async () => {
    await teardownDuckDB();
  });

  for (let seed = 1; seed <= FUZZ_SEEDS; seed++) {
    it(`seed=${seed}`, async () => {
      const rng = new Rng(seed);
      const { csv, layout, headers } = fuzzRawData(rng);
      await loadCSV(csv);
      // throw しないこと
      const diags = await validateRawData(getConn(), headers, layout);
      expect(Array.isArray(diags)).toBe(true);
    });
  }
});
