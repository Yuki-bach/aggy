import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { aggGrandTotal } from "../src/lib/agg/aggGrandTotal";
import { setupDuckDB, teardownDuckDB, getConn, loadCSV } from "./helpers/duckdb";
import { buildCSV } from "./helpers/csv";
import type { Shape } from "../src/lib/agg/types";

beforeAll(async () => {
  await setupDuckDB();
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

describe("aggGrandTotalEdge - SA", () => {
  it("全行同値 → count=5, pct=100", async () => {
    await loadCSV(
      buildCSV(["id", "q1"], [
        [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
      ]),
    );
    const input: Shape = { type: "SA", columns: ["q1"], codes: ["1", "2"] };
    const result = await aggGrandTotal(getConn(), input, "");

    const slice = result.slices[0];
    expect(slice.n).toBe(5);
    expect(slice.cells[0].count).toBe(5);
    expect(slice.cells[0].pct).toBeCloseTo(100, 3);
    expect(slice.cells[1].count).toBe(0);
    expect(slice.cells[1].pct).toBe(0);
  });

  it("全行NULL → n=0", async () => {
    await loadCSV(
      buildCSV(["id", "q1"], [
        [1, null], [2, null], [3, null],
      ]),
    );
    const input: Shape = { type: "SA", columns: ["q1"], codes: ["1"] };
    const result = await aggGrandTotal(getConn(), input, "");

    expect(result.slices[0].n).toBe(0);
  });

  it("1行のみ → n=1, count=1", async () => {
    await loadCSV(buildCSV(["id", "q1"], [[1, 2]]));
    const input: Shape = { type: "SA", columns: ["q1"], codes: ["1", "2"] };
    const result = await aggGrandTotal(getConn(), input, "");

    expect(result.slices[0].n).toBe(1);
    expect(result.slices[0].cells[1].count).toBe(1);
    expect(result.slices[0].cells[1].pct).toBeCloseTo(100, 3);
  });

  it("layoutコードがデータに未出現 → count=0", async () => {
    await loadCSV(
      buildCSV(["id", "q1"], [
        [1, 1], [2, 1], [3, 1],
      ]),
    );
    const input: Shape = { type: "SA", columns: ["q1"], codes: ["1", "2", "3"] };
    const result = await aggGrandTotal(getConn(), input, "");

    expect(result.slices[0].cells[0].count).toBe(3);
    expect(result.slices[0].cells[1].count).toBe(0);
    expect(result.slices[0].cells[2].count).toBe(0);
  });

  it("weight=0の行 → count寄与0", async () => {
    await loadCSV(
      buildCSV(["id", "weight", "q1"], [
        [1, 1.0, 1],
        [2, 0.0, 1],
        [3, 1.0, 2],
      ]),
    );
    const input: Shape = { type: "SA", columns: ["q1"], codes: ["1", "2"] };
    const result = await aggGrandTotal(getConn(), input, "weight");

    expect(result.slices[0].n).toBeCloseTo(2.0, 3);
    expect(result.slices[0].cells[0].count).toBeCloseTo(1.0, 3);
    expect(result.slices[0].cells[1].count).toBeCloseTo(1.0, 3);
  });

  it("weight=1均一 ≡ 重みなし", async () => {
    await loadCSV(
      buildCSV(["id", "weight", "q1"], [
        [1, 1, 1], [2, 1, 2], [3, 1, 1], [4, 1, 3], [5, 1, 2],
      ]),
    );
    const input: Shape = { type: "SA", columns: ["q1"], codes: ["1", "2", "3"] };
    const unweighted = await aggGrandTotal(getConn(), input, "");
    const weighted = await aggGrandTotal(getConn(), input, "weight");

    const uwCounts = unweighted.slices[0].cells.map((c) => c.count);
    const wCounts = weighted.slices[0].cells.map((c) => c.count);
    expect(wCounts).toEqual(uwCounts);
  });
});

describe("aggGrandTotalEdge - MA", () => {
  it("NULL行はshownから除外される → nに寄与しない", async () => {
    // 型推論のため非NULLの行を含む。NULL行のみがshown=falseで除外される
    await loadCSV(
      buildCSV(["id", "q_1", "q_2"], [
        [1, null, null],
        [2, null, null],
        [3, 1, 0],
      ]),
    );
    const input: Shape = { type: "MA", columns: ["q_1", "q_2"], codes: ["1", "2"] };
    const result = await aggGrandTotal(getConn(), input, "");

    // shown行は行3のみ → n=1
    expect(result.slices[0].n).toBe(1);
    expect(result.slices[0].cells[0].count).toBe(1); // q_1=1
    expect(result.slices[0].cells[1].count).toBe(0); // q_2=0
  });

  it("全列0（shown but none selected） → N/A count=n", async () => {
    await loadCSV(
      buildCSV(["id", "q_1", "q_2"], [
        [1, 0, 0],
        [2, 0, 0],
        [3, 0, 0],
      ]),
    );
    const input: Shape = { type: "MA", columns: ["q_1", "q_2"], codes: ["1", "2"] };
    const result = await aggGrandTotal(getConn(), input, "");

    expect(result.slices[0].n).toBe(3);
    expect(result.slices[0].cells[0].count).toBe(0);
    expect(result.slices[0].cells[1].count).toBe(0);
    // N/A should be appended
    expect(result.codes).toContain("N/A");
    const naIdx = result.codes.indexOf("N/A");
    expect(result.slices[0].cells[naIdx].count).toBe(3);
  });
});
