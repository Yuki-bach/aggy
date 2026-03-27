import { describe, it, beforeAll, afterAll } from "vite-plus/test";
import { aggCrossTab } from "../src/agg/aggCrossTab";
import { setupDuckDB, teardownDuckDB, getConn, loadCSV } from "./helpers/duckdb";
import { generateCrossDataset, SEEDS, rowCount } from "./helpers/generators";
import { parseCSVToRows } from "./helpers/parseCSV";
import { oracleSaSaCross, assertOracleMatch } from "./helpers/oracle";

beforeAll(async () => {
  await setupDuckDB();
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

describe("Oracle - aggCrossTab SA×SA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const actual = await aggCrossTab(getConn(), ds.saInput, ds.sa2Input, "");
      const rows = parseCSVToRows(ds.csv);
      const expected = oracleSaSaCross(
        rows,
        "q_sa",
        ds.saInput.codes,
        "q_sa2",
        ds.sa2Input.codes,
        "",
      );
      assertOracleMatch(actual, expected);
    });
  }
});

describe("Oracle - aggCrossTab SA×SA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const actual = await aggCrossTab(getConn(), ds.saInput, ds.sa2Input, ds.weightCol);
      const rows = parseCSVToRows(ds.csv);
      const expected = oracleSaSaCross(
        rows,
        "q_sa",
        ds.saInput.codes,
        "q_sa2",
        ds.sa2Input.codes,
        ds.weightCol,
      );
      assertOracleMatch(actual, expected);
    });
  }
});
