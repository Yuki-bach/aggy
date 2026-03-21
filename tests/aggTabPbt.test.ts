import { describe, it, beforeAll, afterAll } from "vite-plus/test";
import { aggTab } from "../src/lib/agg/aggTab";
import { setupDuckDB, teardownDuckDB, getConn, loadCSV } from "./helpers/duckdb";
import { generateSADataset, generateMADataset, SEEDS, rowCount } from "./helpers/generators";
import { assertTabInvariants } from "./helpers/invariants";

beforeAll(async () => {
  await setupDuckDB();
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

describe("PBT - aggTab SA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateSADataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const result = await aggTab(getConn(), ds.shape, "");
      assertTabInvariants(result, "SA");
    });
  }
});

describe("PBT - aggTab SA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateSADataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const result = await aggTab(getConn(), ds.shape, ds.weightCol);
      assertTabInvariants(result, "SA");
    });
  }
});

describe("PBT - aggTab MA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateMADataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const result = await aggTab(getConn(), ds.shape, "");
      assertTabInvariants(result, "MA");
    });
  }
});

describe("PBT - aggTab MA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateMADataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const result = await aggTab(getConn(), ds.shape, ds.weightCol);
      assertTabInvariants(result, "MA");
    });
  }
});
