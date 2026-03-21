import { describe, it, expect, beforeAll, afterAll } from "vite-plus/test";
import { aggNaTab } from "../src/lib/agg/aggNa";
import { setupDuckDB, teardownDuckDB, getConn, loadCSV } from "./helpers/duckdb";
import { buildCSV } from "./helpers/csv";

beforeAll(async () => {
  await setupDuckDB();
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

describe("aggNaTabEdge", () => {
  it("全値同一 → sd=0, mean=median=min=max=その値", async () => {
    await loadCSV(
      buildCSV(
        ["id", "score"],
        [
          [1, 5],
          [2, 5],
          [3, 5],
          [4, 5],
          [5, 5],
        ],
      ),
    );
    const result = await aggNaTab(getConn(), "score", "");
    const slice = result.slices[0];

    expect(slice.stats!.sd).toBe(0);
    expect(slice.stats!.mean).toBe(5);
    expect(slice.stats!.median).toBe(5);
    expect(slice.stats!.min).toBe(5);
    expect(slice.stats!.max).toBe(5);
    expect(result.codes).toEqual(["5"]);
    expect(slice.cells[0].pct).toBeCloseTo(100, 3);
  });

  it("n=1 → STDDEV_SAMP=NULL → sd=0", async () => {
    await loadCSV(buildCSV(["id", "score"], [[1, 7]]));
    const result = await aggNaTab(getConn(), "score", "");
    const slice = result.slices[0];

    expect(slice.stats!.n).toBe(1);
    expect(slice.stats!.sd).toBe(0);
    expect(slice.stats!.mean).toBe(7);
    expect(slice.stats!.min).toBe(7);
    expect(slice.stats!.max).toBe(7);
  });

  it("全行NULL → n=0, cells空", async () => {
    await loadCSV(
      buildCSV(
        ["id", "score"],
        [
          [1, null],
          [2, null],
          [3, null],
        ],
      ),
    );
    const result = await aggNaTab(getConn(), "score", "");
    const slice = result.slices[0];

    expect(slice.stats!.n).toBe(0);
    expect(result.codes).toEqual([]);
    expect(slice.cells).toEqual([]);
  });

  it("数値キャスト不可の値 → NULL扱いで除外", async () => {
    await loadCSV(
      buildCSV(
        ["id", "score"],
        [
          [1, "abc"],
          [2, 3],
          [3, "xyz"],
          [4, 7],
        ],
      ),
    );
    const result = await aggNaTab(getConn(), "score", "");
    const slice = result.slices[0];

    expect(slice.stats!.n).toBe(2);
    expect(slice.stats!.mean).toBe(5);
    expect(slice.stats!.min).toBe(3);
    expect(slice.stats!.max).toBe(7);
    expect(result.codes).toEqual(["3", "7"]);
  });
});
