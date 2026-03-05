import { describe, it, beforeAll, afterAll } from "vitest";
import { aggregateCross } from "../src/lib/agg/aggregateCross";
import { setupDuckDB, teardownDuckDB, getConn, loadCSV } from "./helpers/duckdb";
import { generateCrossDataset } from "./helpers/generators";
import { assertCrossInvariants } from "./helpers/invariants";

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

describe("PBT - aggregateCross SA×SA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const result = await aggregateCross(getConn(), ds.saInput, ds.sa2Input, "");
      assertCrossInvariants(result, "SA", ds.sa2Input.codes.length);
    });
  }
});

describe("PBT - aggregateCross SA×SA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const result = await aggregateCross(getConn(), ds.saInput, ds.sa2Input, ds.weightCol);
      assertCrossInvariants(result, "SA", ds.sa2Input.codes.length);
    });
  }
});

describe("PBT - aggregateCross MA×SA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const result = await aggregateCross(getConn(), ds.maInput, ds.saInput, "");
      assertCrossInvariants(result, "MA", ds.saInput.codes.length);
    });
  }
});

describe("PBT - aggregateCross MA×SA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const result = await aggregateCross(getConn(), ds.maInput, ds.saInput, ds.weightCol);
      assertCrossInvariants(result, "MA", ds.saInput.codes.length);
    });
  }
});

describe("PBT - aggregateCross SA×MA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const result = await aggregateCross(getConn(), ds.saInput, ds.maInput, "");
      assertCrossInvariants(result, "SA", ds.maInput.codes.length);
    });
  }
});

describe("PBT - aggregateCross SA×MA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const result = await aggregateCross(getConn(), ds.saInput, ds.maInput, ds.weightCol);
      assertCrossInvariants(result, "SA", ds.maInput.codes.length);
    });
  }
});

describe("PBT - aggregateCross MA×MA 重みなし", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed) });
      await loadCSV(ds.csv);
      const result = await aggregateCross(getConn(), ds.maInput, ds.maInput, "");
      assertCrossInvariants(result, "MA", ds.maInput.codes.length);
    });
  }
});

describe("PBT - aggregateCross MA×MA 重みあり", () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    it(`seed=${seed}, rows=${rowCount(seed)}`, async () => {
      const ds = generateCrossDataset({ seed, rowCount: rowCount(seed), weighted: true });
      await loadCSV(ds.csv);
      const result = await aggregateCross(getConn(), ds.maInput, ds.maInput, ds.weightCol);
      assertCrossInvariants(result, "MA", ds.maInput.codes.length);
    });
  }
});
