import { type Page, expect } from "@playwright/test";
import path from "node:path";

export const TESTDATA = path.resolve(import.meta.dirname, "../testdata");

/** DuckDB Wasm が "DuckDB Ready" になるまで明示待機 + エラー文言不在確認 */
export async function waitForWasmReady(page: Page): Promise<void> {
  const statusEl = page.locator('[role="status"]');
  await statusEl.filter({ hasText: /DuckDB (ready|準備完了)/ }).waitFor({ timeout: 30_000 });
  await expect(statusEl).not.toContainText(/エラー|error/i);
}

/** CSV + Layout JSON をアップロード */
export async function uploadFiles(page: Page): Promise<void> {
  const csvInput = page.locator('input[type="file"][accept=".csv"]');
  const jsonInput = page.locator('input[type="file"][accept=".json"]');
  await csvInput.setInputFiles(path.join(TESTDATA, "test_data.csv"));
  await jsonInput.setInputFiles(path.join(TESTDATA, "test_layout.json"));
}

/** 「集計開始」ボタンをクリックして集計画面へ進む */
export async function proceedToAggregation(page: Page): Promise<void> {
  await page.getByRole("button", { name: /集計開始/ }).click();
  // 正常データの場合はバリデーションをスキップして直接集計画面へ遷移し、
  // 自動集計が完了して結果テーブルが描画されたことを「xxx の集計結果」表記で確認する
  await expect(page.getByText(/の集計結果/).first()).toBeVisible({
    timeout: 30_000,
  });
}

/** 指定ファイルをアップロード */
export async function uploadCustomFiles(
  page: Page,
  csvPath: string,
  jsonPath: string,
): Promise<void> {
  const csvInput = page.locator('input[type="file"][accept=".csv"]');
  const jsonInput = page.locator('input[type="file"][accept=".json"]');
  await csvInput.setInputFiles(csvPath);
  await jsonInput.setInputFiles(jsonPath);
}
