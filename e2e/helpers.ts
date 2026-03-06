import { type Page, expect } from "@playwright/test";
import path from "node:path";

export const TESTDATA = path.resolve(import.meta.dirname, "../testdata");

/** DuckDB Wasm が "DuckDB Ready" になるまで明示待機 + エラー文言不在確認 */
export async function waitForWasmReady(page: Page): Promise<void> {
  const statusEl = page.locator('[role="status"]');
  await statusEl
    .filter({ hasText: "DuckDB Ready" })
    .waitFor({ timeout: 30_000 });
  await expect(statusEl).not.toContainText("エラー");
}

/** CSV + Layout JSON をアップロード */
export async function uploadFiles(page: Page): Promise<void> {
  const csvInput = page.locator('input[type="file"][accept=".csv"]');
  const jsonInput = page.locator('input[type="file"][accept=".json"]');
  await csvInput.setInputFiles(path.join(TESTDATA, "test_data.csv"));
  await jsonInput.setInputFiles(path.join(TESTDATA, "test_layout.json"));
}

/** Step 1 → Step 2 (検証) → 集計画面へ進む */
export async function proceedToAggregation(page: Page): Promise<void> {
  await page.getByRole("button", { name: /検証/ }).click();
  await page
    .getByRole("button", { name: /集計画面へ進む/ })
    .waitFor({ timeout: 15_000 });
  await page.getByRole("button", { name: /集計画面へ進む/ }).click();
}
