import { describe, it, beforeAll, afterAll } from "vite-plus/test";
import { aggTab } from "../src/agg/aggTab";
import { setupDuckDB, teardownDuckDB, getConn, loadCSV } from "./helpers/duckdb";
import { generateSADataset, generateMADataset, SEEDS, rowCount } from "./helpers/generators";
import { parseCSVToRows } from "./helpers/parseCSV";
import { oracleSaTab, oracleMaTab, assertOracleMatch } from "./helpers/oracle";

beforeAll(async () => {
  await setupDuckDB();
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

describe("Oracle - aggTab SA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateSADataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const actual = await aggTab(getConn(), ds.shape, "");
      const rows = parseCSVToRows(ds.csv);
      const expected = oracleSaTab(rows, "q_sa", ds.shape.codes, "");
      assertOracleMatch(actual, expected);
    });
  }
});

describe("Oracle - aggTab SA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateSADataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const actual = await aggTab(getConn(), ds.shape, ds.weightCol);
      const rows = parseCSVToRows(ds.csv);
      const expected = oracleSaTab(rows, "q_sa", ds.shape.codes, ds.weightCol);
      assertOracleMatch(actual, expected);
    });
  }
});

describe("Oracle - aggTab MA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateMADataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const actual = await aggTab(getConn(), ds.shape, "");
      const rows = parseCSVToRows(ds.csv);
      const expected = oracleMaTab(rows, ds.shape.columns, ds.shape.codes, "");
      assertOracleMatch(actual, expected);
    });
  }
});

describe("Oracle - aggTab MA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateMADataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const actual = await aggTab(getConn(), ds.shape, ds.weightCol);
      const rows = parseCSVToRows(ds.csv);
      const expected = oracleMaTab(rows, ds.shape.columns, ds.shape.codes, ds.weightCol);
      assertOracleMatch(actual, expected);
    });
  }
});
