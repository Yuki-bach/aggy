import { describe, it, beforeAll, afterAll } from "vite-plus/test";
import { aggNaTab } from "../src/lib/agg/aggNaTab";
import { setupDuckDB, teardownDuckDB, getConn, loadCSV } from "./helpers/duckdb";
import { generateNADataset } from "./helpers/generators";
import { parseCSVToRows } from "./helpers/parseCSV";
import { oracleNaTab, assertOracleMatch } from "./helpers/oracle";

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

describe("Oracle - aggNaTab 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateNADataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const actual = await aggNaTab(getConn(), ds.column, "");
      const rows = parseCSVToRows(ds.csv);
      const expected = oracleNaTab(rows, "q_na", "");
      assertOracleMatch(actual, expected);
    });
  }
});

describe("Oracle - aggNaTab 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateNADataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const actual = await aggNaTab(getConn(), ds.column, ds.weightCol);
      const rows = parseCSVToRows(ds.csv);
      const expected = oracleNaTab(rows, "q_na", ds.weightCol);
      assertOracleMatch(actual, expected);
    });
  }
});
