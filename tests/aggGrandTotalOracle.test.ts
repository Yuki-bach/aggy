import { describe, it, beforeAll, afterAll } from "vitest";
import { aggGrandTotal } from "../src/lib/agg/aggGrandTotal";
import { setupDuckDB, teardownDuckDB, getConn, loadCSV } from "./helpers/duckdb";
import { generateSADataset, generateMADataset } from "./helpers/generators";
import { parseCSVToRows } from "./helpers/parseCSV";
import {
  oracleSaGrandTotal,
  oracleMaGrandTotal,
  assertOracleMatch,
} from "./helpers/oracle";

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

describe("Oracle - aggGrandTotal SA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateSADataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const actual = await aggGrandTotal(getConn(), ds.shape, "");
      const rows = parseCSVToRows(ds.csv);
      const expected = oracleSaGrandTotal(rows, "q_sa", ds.shape.codes, "");
      assertOracleMatch(actual, expected);
    });
  }
});

describe("Oracle - aggGrandTotal SA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateSADataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const actual = await aggGrandTotal(getConn(), ds.shape, ds.weightCol);
      const rows = parseCSVToRows(ds.csv);
      const expected = oracleSaGrandTotal(rows, "q_sa", ds.shape.codes, ds.weightCol);
      assertOracleMatch(actual, expected);
    });
  }
});

describe("Oracle - aggGrandTotal MA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateMADataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const actual = await aggGrandTotal(getConn(), ds.shape, "");
      const rows = parseCSVToRows(ds.csv);
      const expected = oracleMaGrandTotal(rows, ds.shape.columns, ds.shape.codes, "");
      assertOracleMatch(actual, expected);
    });
  }
});

describe("Oracle - aggGrandTotal MA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateMADataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const actual = await aggGrandTotal(getConn(), ds.shape, ds.weightCol);
      const rows = parseCSVToRows(ds.csv);
      const expected = oracleMaGrandTotal(
        rows,
        ds.shape.columns,
        ds.shape.codes,
        ds.weightCol,
      );
      assertOracleMatch(actual, expected);
    });
  }
});
