import { describe, it, beforeAll, afterAll } from "vite-plus/test";
import { aggCrossTab } from "../src/lib/agg/aggCrossTab";
import { setupDuckDB, teardownDuckDB, getConn, loadCSV } from "./helpers/duckdb";
import { generateCrossDataset, SEEDS, rowCount } from "./helpers/generators";
import { assertCrossInvariants } from "./helpers/invariants";

beforeAll(async () => {
  await setupDuckDB();
}, 30_000);

afterAll(async () => {
  await teardownDuckDB();
});

describe("PBT - aggCrossTab SA×SA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const result = await aggCrossTab(getConn(), ds.saInput, ds.sa2Input, "");
      assertCrossInvariants(result, "SA", ds.sa2Input.codes.length);
    });
  }
});

describe("PBT - aggCrossTab SA×SA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const result = await aggCrossTab(getConn(), ds.saInput, ds.sa2Input, ds.weightCol);
      assertCrossInvariants(result, "SA", ds.sa2Input.codes.length);
    });
  }
});

describe("PBT - aggCrossTab MA×SA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const result = await aggCrossTab(getConn(), ds.maInput, ds.saInput, "");
      assertCrossInvariants(result, "MA", ds.saInput.codes.length);
    });
  }
});

describe("PBT - aggCrossTab MA×SA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const result = await aggCrossTab(getConn(), ds.maInput, ds.saInput, ds.weightCol);
      assertCrossInvariants(result, "MA", ds.saInput.codes.length);
    });
  }
});

describe("PBT - aggCrossTab SA×MA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const result = await aggCrossTab(getConn(), ds.saInput, ds.maInput, "");
      assertCrossInvariants(result, "SA", ds.maInput.codes.length);
    });
  }
});

describe("PBT - aggCrossTab SA×MA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const result = await aggCrossTab(getConn(), ds.saInput, ds.maInput, ds.weightCol);
      assertCrossInvariants(result, "SA", ds.maInput.codes.length);
    });
  }
});

describe("PBT - aggCrossTab MA×MA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const result = await aggCrossTab(getConn(), ds.maInput, ds.maInput, "");
      assertCrossInvariants(result, "MA", ds.maInput.codes.length);
    });
  }
});

describe("PBT - aggCrossTab MA×MA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const result = await aggCrossTab(getConn(), ds.maInput, ds.maInput, ds.weightCol);
      assertCrossInvariants(result, "MA", ds.maInput.codes.length);
    });
  }
});
