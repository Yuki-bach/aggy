import { describe, it, beforeAll, afterAll } from "vitest";
import { aggTotals } from "../src/lib/agg/aggTotals";
import { setupDuckDB, teardownDuckDB, getConn, loadCSV } from "./helpers/duckdb";
import { generateSADataset, generateMADataset } from "./helpers/generators";
import { assertGtInvariants } from "./helpers/invariants";

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

describe("PBT - aggTotals SA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateSADataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const result = await aggTotals(getConn(), ds.aggInput, "");
      assertGtInvariants(result, "SA");
    });
  }
});

describe("PBT - aggTotals SA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateSADataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const result = await aggTotals(getConn(), ds.aggInput, ds.weightCol);
      assertGtInvariants(result, "SA");
    });
  }
});

describe("PBT - aggTotals MA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateMADataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const result = await aggTotals(getConn(), ds.aggInput, "");
      assertGtInvariants(result, "MA");
    });
  }
});

describe("PBT - aggTotals MA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateMADataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const result = await aggTotals(getConn(), ds.aggInput, ds.weightCol);
      assertGtInvariants(result, "MA");
    });
  }
});
