import { test, expect, type Page } from "@playwright/test";
import { waitForWasmReady, uploadFiles, proceedToAggregation } from "./helpers";

/** OPFS が利用可能かチェックし、不可なら true を返す */
async function isOpfsUnavailable(page: Page): Promise<boolean> {
  return page.evaluate(async () => {
    try {
      await navigator.storage.getDirectory();
      return false;
    } catch {
      return true;
    }
  });
}

/** OPFS の aggy-data 内エントリをすべて削除 */
async function clearOpfs(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    let dir: FileSystemDirectoryHandle;
    try {
      dir = await root.getDirectoryHandle("aggy-data");
    } catch {
      return;
    }
    const names: string[] = [];
    for await (const [name] of dir.entries()) names.push(name);
    for (const name of names) {
      await dir.removeEntry(name, { recursive: true });
    }
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await waitForWasmReady(page);

  // OPFS が利用不可なブラウザ（WebKit テスト環境など）ではスキップ
  if (await isOpfsUnavailable(page)) {
    test.skip(true, "OPFS is not available in this browser environment");
    return;
  }

  await clearOpfs(page);

  // クリア後にページをリロードして履歴UIを更新
  await page.reload();
  await waitForWasmReady(page);
});

/** アップロード → 集計画面遷移 → インポート画面に戻り、履歴が存在する状態にする */
async function createHistoryEntry(page: Page): Promise<void> {
  await uploadFiles(page);
  await proceedToAggregation(page);
  await expect(
    page.getByRole("button", { name: /集計を実行/ }),
  ).toBeVisible({ timeout: 30_000 });
  await page.goto("/");
  await waitForWasmReady(page);
}

test("集計画面遷移後、履歴にエントリが追加される", async ({ page }) => {
  // 初期状態では「履歴なし」が表示される
  await expect(page.getByText("履歴なし")).toBeVisible();

  await createHistoryEntry(page);

  // 履歴に test_data.csv のエントリが表示される
  await expect(
    page.getByRole("button", { name: /test_data\.csv/ }).first(),
  ).toBeVisible();
});

test("履歴からデータを読み込み、集計画面に遷移できる", async ({ page }) => {
  await createHistoryEntry(page);

  // 履歴エントリをクリック
  await page.getByRole("button", { name: /test_data\.csv/ }).first().click();

  // ファイル名が表示されることを確認
  await expect(page.getByText("test_data.csv")).toBeVisible();
  await expect(page.getByText("test_layout.json")).toBeVisible();

  // 集計画面へ遷移できる
  await proceedToAggregation(page);
  await expect(
    page.getByRole("button", { name: /集計を実行/ }),
  ).toBeVisible();
});

test("履歴エントリを削除できる", async ({ page }) => {
  await createHistoryEntry(page);

  // 削除ボタンをクリック
  await page.getByRole("button", { name: /test_data\.csv を削除/ }).click();

  // 「履歴なし」が表示される
  await expect(page.getByText("履歴なし")).toBeVisible();
});
