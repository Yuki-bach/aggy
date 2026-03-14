import { describe, it, beforeAll, afterAll } from "vitest";
import { aggNaCrossTab } from "../src/lib/agg/aggNa";
import { setupDuckDB, teardownDuckDB, getConn, loadCSV } from "./helpers/duckdb";
import { generateNACrossDataset } from "./helpers/generators";
import { assertNaCrossInvariants } from "./helpers/invariants";

beforeAll(async () => {
  await setupDuckDB();
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

const SEEDS = 50;
const ROW_RANGE = { min: 50, max: 200 };

function rowCount(seed: number): number {
  return ROW_RANGE.min + ((seed * 17) % (ROW_RANGE.max - ROW_RANGE.min + 1));
}

describe("PBT - aggNaCrossTab NA×SA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateNACrossDataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const result = await aggNaCrossTab(getConn(), ds.naColumn, ds.saAxis, "");
      assertNaCrossInvariants(result, ds.saAxis.codes.length);
    });
  }
});

describe("PBT - aggNaCrossTab NA×SA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateNACrossDataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const result = await aggNaCrossTab(getConn(), ds.naColumn, ds.saAxis, ds.weightCol);
      assertNaCrossInvariants(result, ds.saAxis.codes.length);
    });
  }
});

describe("PBT - aggNaCrossTab NA×MA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateNACrossDataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const result = await aggNaCrossTab(getConn(), ds.naColumn, ds.maAxis, "");
      assertNaCrossInvariants(result, ds.maAxis.codes.length);
    });
  }
});

describe("PBT - aggNaCrossTab NA×MA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateNACrossDataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const result = await aggNaCrossTab(getConn(), ds.naColumn, ds.maAxis, ds.weightCol);
      assertNaCrossInvariants(result, ds.maAxis.codes.length);
    });
  }
});
