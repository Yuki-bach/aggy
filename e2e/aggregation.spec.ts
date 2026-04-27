import { test, expect } from "@playwright/test";
import { waitForWasmReady, uploadFiles, proceedToAggregation } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await waitForWasmReady(page);
});

test("ファイルアップロード → 検証 → 集計画面遷移", async ({ page }) => {
  await uploadFiles(page);

  // ファイル名が表示されること
  await expect(page.getByText("test_data.csv")).toBeVisible();
  await expect(page.getByText("test_layout.json")).toBeVisible();

  // 検証 → 集計画面へ進む
  await proceedToAggregation(page);

  // 集計画面の「集計設定」ボタンが表示される
  await expect(page.getByRole("button", { name: /集計設定を開く/ })).toBeVisible();
});

test("GT集計結果の自動表示", async ({ page }) => {
  await uploadFiles(page);
  await proceedToAggregation(page);

  // 自動実行による Grand Total テーブルが表示される
  // テーブル caption でラベルを確認（getByText だと複数要素にマッチするため）
  await expect(page.getByText("性別 の集計結果")).toBeAttached({
    timeout: 30_000,
  });
  await expect(page.getByText("満足度 の集計結果")).toBeAttached();
  await expect(page.getByText("利用しているサービス の集計結果")).toBeAttached();

  // テーブルが 3 つ以上存在すること
  const tables = page.locator("table");
  await expect(tables).toHaveCount(3, { timeout: 15_000 });
});

test("クロス集計", async ({ page }) => {
  await uploadFiles(page);
  await proceedToAggregation(page);

  // Grand Total テーブル表示を待つ
  await expect(page.getByText("性別 の集計結果")).toBeAttached({
    timeout: 30_000,
  });

  // 集計設定ボタンを押して popover を開く
  await page.getByRole("button", { name: /集計設定を開く/ }).click();

  // popover 内の最初のチェックボックス（q1 = 性別）を ON
  const crossAxisGroup = page.getByRole("group", {
    name: /クロス集計軸の選択/,
  });
  await crossAxisGroup.getByRole("checkbox").first().check();

  // 即時集計でクロスヘッダー（「性別」列ヘッダー）がテーブル内に表示されること
  const crossHeader = page.locator("table th", { hasText: "性別" });
  await expect(crossHeader.first()).toBeVisible({ timeout: 30_000 });
});
