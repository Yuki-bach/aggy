import { test, expect } from "@playwright/test";
import path from "node:path";
import { waitForWasmReady, uploadCustomFiles, TESTDATA } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await waitForWasmReady(page);
});

test("SA未定義コード → 診断画面にエラー表示、集計へ進めない", async ({ page }) => {
  await uploadCustomFiles(
    page,
    path.join(TESTDATA, "bad_unknown_code.csv"),
    path.join(TESTDATA, "test_layout.json"),
  );

  await page.getByRole("button", { name: /集計開始/ }).click();

  // 診断画面が表示される
  await expect(page.getByText("データ検証")).toBeVisible({ timeout: 15_000 });

  // 未定義コードのエラーが表示される
  await expect(page.getByText(/未定義コード/)).toBeVisible();

  // 「集計画面へ進む」ボタンが表示されない（エラーがあるため）
  await expect(page.getByRole("button", { name: /集計画面へ進む/ })).not.toBeVisible();

  // 「ファイル選択に戻る」ボタンが表示される
  await expect(page.getByRole("button", { name: /ファイル選択に戻る/ })).toBeVisible();
});

test("レイアウト構造エラー → 診断画面にエラー表示", async ({ page }) => {
  await uploadCustomFiles(
    page,
    path.join(TESTDATA, "test_data.csv"),
    path.join(TESTDATA, "bad_layout.json"),
  );

  await page.getByRole("button", { name: /集計開始/ }).click();

  // 診断画面が表示される
  await expect(page.getByText("データ検証")).toBeVisible({ timeout: 15_000 });

  // レイアウト構造のチェックがエラーになっている
  await expect(page.getByText("エラーあり")).toBeVisible();

  // 「集計画面へ進む」ボタンが表示されない
  await expect(page.getByRole("button", { name: /集計画面へ進む/ })).not.toBeVisible();
});

test("エラー表示後、ファイル選択に戻って正常ファイルで集計できる", async ({ page }) => {
  // まず不正データでエラーを出す
  await uploadCustomFiles(
    page,
    path.join(TESTDATA, "bad_unknown_code.csv"),
    path.join(TESTDATA, "test_layout.json"),
  );
  await page.getByRole("button", { name: /集計開始/ }).click();
  await expect(page.getByText("データ検証")).toBeVisible({ timeout: 15_000 });

  // ファイル選択に戻る
  await page.getByRole("button", { name: /ファイル選択に戻る/ }).click();

  // 正常データで再アップロード
  await uploadCustomFiles(
    page,
    path.join(TESTDATA, "test_data.csv"),
    path.join(TESTDATA, "test_layout.json"),
  );
  await page.getByRole("button", { name: /集計開始/ }).click();

  // 正常データなので直接集計画面へ遷移し、自動集計の結果が表示される
  await expect(page.getByText(/の集計結果/).first()).toBeVisible({
    timeout: 30_000,
  });
});

test("先行 validation: 正常ファイル → 集計画面へ直接遷移", async ({ page }) => {
  await uploadCustomFiles(
    page,
    path.join(TESTDATA, "test_data.csv"),
    path.join(TESTDATA, "test_layout.json"),
  );

  await page.getByRole("button", { name: /集計開始/ }).click();

  // 診断画面をスキップして集計画面へ遷移し、自動集計の結果が表示される
  await expect(page.getByText(/の集計結果/).first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("データ検証")).not.toBeVisible();
});

test("先行 validation: 不正→正常にファイルを差し替えると集計画面へ遷移", async ({ page }) => {
  // 先に不正データをアップロード（戻るボタンは押さない）
  await uploadCustomFiles(
    page,
    path.join(TESTDATA, "bad_unknown_code.csv"),
    path.join(TESTDATA, "test_layout.json"),
  );
  // 先行 validation が完了し、Start Aggregation ボタンが有効になるのを待つ
  await expect(page.getByRole("button", { name: /集計開始/ })).toBeEnabled();

  // 同じ画面のまま正常データに差し替え
  await uploadCustomFiles(
    page,
    path.join(TESTDATA, "test_data.csv"),
    path.join(TESTDATA, "test_layout.json"),
  );

  await page.getByRole("button", { name: /集計開始/ }).click();

  // 最新ファイルで validation が再実行され、エラーなしで集計画面へ遷移する
  await expect(page.getByText(/の集計結果/).first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("データ検証")).not.toBeVisible();
});

test("先行 validation: 正常→不正にファイルを差し替えるとエラー画面へ遷移", async ({ page }) => {
  // 先に正常データをアップロード
  await uploadCustomFiles(
    page,
    path.join(TESTDATA, "test_data.csv"),
    path.join(TESTDATA, "test_layout.json"),
  );
  await expect(page.getByRole("button", { name: /集計開始/ })).toBeEnabled();

  // 同じ画面のまま不正データに差し替え
  await uploadCustomFiles(
    page,
    path.join(TESTDATA, "bad_unknown_code.csv"),
    path.join(TESTDATA, "test_layout.json"),
  );

  await page.getByRole("button", { name: /集計開始/ }).click();

  // 最新ファイルで validation が再実行され、エラー画面に遷移する
  await expect(page.getByText("データ検証")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/未定義コード/)).toBeVisible();
  await expect(page.getByText(/の集計結果/)).not.toBeVisible();
});
