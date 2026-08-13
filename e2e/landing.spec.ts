import { test, expect } from "@playwright/test";

test.describe("Data Cinematic landing page", () => {
  test("日本語LPの主要導線と装飾Canvasを表示する", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("手元のデータを高速集計");
    await expect(page.getByRole("link", { name: /無料で集計を始める/ })).toHaveAttribute(
      "href",
      "/app/",
    );
    await expect(page.locator('.site-nav a[href="#how-it-works"]')).toBeVisible();
    await expect(page.locator("canvas[data-data-flow]")).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator(".steps-grid > li")).toHaveCount(3);
  });

  test("英語LPも同じ構造と英語導線を持つ", async ({ page }) => {
    await page.goto("/en/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Turn raw data into");
    await expect(page.getByRole("link", { name: /Start aggregating for free/ })).toHaveAttribute(
      "href",
      "/app/?lang=en",
    );
    await expect(page.locator(".steps-grid > li")).toHaveCount(3);
    await expect(page.locator("canvas[data-data-flow]")).toHaveAttribute("aria-hidden", "true");
  });

  test("WebGLコンテキスト喪失時に静的フォールバックへ切り替える", async ({ page }) => {
    await page.goto("/");
    const canvas = page.locator("canvas[data-data-flow]");
    await canvas.dispatchEvent("webglcontextlost");

    await expect(page.locator("html")).toHaveClass(/webgl-fallback/);
    await expect(page.getByRole("link", { name: /無料で集計を始める/ })).toBeVisible();
  });

  test("モーション低減設定では完成状態を静的に表示する", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.locator("html")).toHaveClass(/motion-static/);
    await expect(page.locator("canvas[data-data-flow]")).toBeHidden();
    await expect(page.getByRole("heading", { name: "3ステップで集計完了。" })).toBeVisible();
  });
});
