import { describe, it, beforeAll, afterAll } from "vitest";
import { aggNaGrandTotal } from "../src/lib/agg/aggNa";
import { setupDuckDB, teardownDuckDB, getConn, loadCSV } from "./helpers/duckdb";
import { generateNADataset } from "./helpers/generators";
import { assertNaGrandTotalInvariants } from "./helpers/invariants";

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

describe("PBT - aggNaGrandTotal 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateNADataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const result = await aggNaGrandTotal(getConn(), ds.column, "");
      assertNaGrandTotalInvariants(result);
    });
  }
});

describe("PBT - aggNaGrandTotal 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateNADataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const result = await aggNaGrandTotal(getConn(), ds.column, ds.weightCol);
      assertNaGrandTotalInvariants(result);
    });
  }
});
