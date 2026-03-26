import { describe, it, expect, beforeAll, afterAll } from "vite-plus/test";
import { aggNaTab } from "../src/agg/aggNaTab";
import { aggNaCrossTab } from "../src/agg/aggNaCrossTab";
import { setupDuckDB, teardownDuckDB, getConn, loadCSV } from "./helpers/duckdb";
import type { Shape } from "../src/agg/types";

// Test CSV with a numeric column (score: 0-10 NPS-like)
const CSV = `id,weight,q1,score
1,1.2,1,8
2,0.9,1,6
3,1.5,2,9
4,0.8,2,4
5,1.1,1,7
6,1.0,2,5
7,1.3,1,10
8,0.7,2,3
9,1.4,1,8
10,1.0,2,
`;

const crossSA: Shape = { type: "SA", columns: ["q1"], codes: ["1", "2"] };

beforeAll(async () => {
  await setupDuckDB();
  await loadCSV(CSV);
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

describe("aggNaTab - unweighted", () => {
  it("returns correct stats for score column", async () => {
    const result = await aggNaTab(getConn(), "score", "");

    expect(result.slices).toHaveLength(1);
    const slice = result.slices[0];
    expect(slice.code).toBeNull();
    // Valid scores: 8,6,9,4,7,5,10,3,8 = 9 rows (row 10 has NULL)
    expect(slice.stats!.n).toBe(9);
    // mean = (8+6+9+4+7+5+10+3+8)/9 = 60/9 ≈ 6.6667
    expect(slice.stats!.mean).toBeCloseTo(60 / 9, 2);
    // sorted: 3,4,5,6,7,8,8,9,10 → median = 7
    expect(slice.stats!.median).toBeCloseTo(7, 1);
    expect(slice.stats!.min).toBe(3);
    expect(slice.stats!.max).toBe(10);
    expect(slice.stats!.sd).toBeGreaterThan(0);
  });

  it("returns correct frequency distribution as codes/cells", async () => {
    const result = await aggNaTab(getConn(), "score", "");

    // Unique values: 3,4,5,6,7,8,9,10
    expect(result.codes).toEqual(["3", "4", "5", "6", "7", "8", "9", "10"]);

    const slice = result.slices[0];
    // 8 appears twice, others once
    const idx8 = result.codes.indexOf("8");
    expect(slice.cells[idx8].count).toBe(2);

    const idx3 = result.codes.indexOf("3");
    expect(slice.cells[idx3].count).toBe(1);

    // pct check: count=2 out of n=9 → 2/9*100 ≈ 22.22
    expect(slice.cells[idx8].pct).toBeCloseTo((2 / 9) * 100, 1);
  });
});

describe("aggNaTab - weighted", () => {
  it("returns weighted stats", async () => {
    const result = await aggNaTab(getConn(), "score", "weight");

    const slice = result.slices[0];
    // Weighted n = sum of weights for valid score rows
    // 1.2+0.9+1.5+0.8+1.1+1.0+1.3+0.7+1.4 = 9.9
    expect(slice.stats!.n).toBeCloseTo(9.9, 1);
    // Weighted mean = sum(score*weight)/sum(weight)
    // = (8*1.2+6*0.9+9*1.5+4*0.8+7*1.1+5*1.0+10*1.3+3*0.7+8*1.4) / 9.9
    // = (9.6+5.4+13.5+3.2+7.7+5.0+13.0+2.1+11.2) / 9.9
    // = 70.7 / 9.9 ≈ 7.1414
    expect(slice.stats!.mean).toBeCloseTo(70.7 / 9.9, 1);
  });
});

describe("aggNaCrossTab - NA × SA", () => {
  it("returns slices grouped by cross column", async () => {
    const result = await aggNaCrossTab(getConn(), "score", crossSA, "");

    expect(result.slices).toHaveLength(2);
    expect(result.slices[0].code).toBe("1");
    expect(result.slices[1].code).toBe("2");

    // q1=1: rows 1(8),2(6),5(7),7(10),9(8) → n=5, mean=(8+6+7+10+8)/5=39/5=7.8
    expect(result.slices[0].stats!.n).toBe(5);
    expect(result.slices[0].stats!.mean).toBeCloseTo(7.8, 1);

    // q1=2: rows 3(9),4(4),6(5),8(3) → n=4, mean=(9+4+5+3)/4=21/4=5.25
    // row 10 has score=NULL so excluded
    expect(result.slices[1].stats!.n).toBe(4);
    expect(result.slices[1].stats!.mean).toBeCloseTo(5.25, 1);
  });

  it("returns aligned codes and cells per cross segment", async () => {
    const result = await aggNaCrossTab(getConn(), "score", crossSA, "");

    // All unique values across both segments: 3,4,5,6,7,8,9,10
    expect(result.codes).toEqual(["3", "4", "5", "6", "7", "8", "9", "10"]);

    // q1=1 values: 6,7,8,8,10 — so 3,4,5 should be 0
    const slice1 = result.slices[0];
    const idx3 = result.codes.indexOf("3");
    expect(slice1.cells[idx3].count).toBe(0);
    const idx8 = result.codes.indexOf("8");
    expect(slice1.cells[idx8].count).toBe(2);

    // q1=2 values: 3,4,5,9 — so 6,7,8,10 should be 0
    const slice2 = result.slices[1];
    const idx6 = result.codes.indexOf("6");
    expect(slice2.cells[idx6].count).toBe(0);
    const idx9 = result.codes.indexOf("9");
    expect(slice2.cells[idx9].count).toBe(1);
  });
});
