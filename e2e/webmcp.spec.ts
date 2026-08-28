/// <reference types="webmcp-types" />

import { expect, test, type Page } from "@playwright/test";
import { proceedToAggregation, uploadFiles, waitForWasmReady } from "./helpers";

async function installWebMcpMock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const tools: Record<string, WebMCP.ModelContextTool> = {};
    Object.defineProperty(window, "__aggyWebMcpTools", { value: tools, configurable: true });
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool: async (
          tool: WebMCP.ModelContextTool,
          options?: WebMCP.ModelContextRegisterToolOptions,
        ) => {
          tools[tool.name] = tool;
          options?.signal?.addEventListener("abort", () => delete tools[tool.name], { once: true });
        },
      },
    });
  });
}

async function executeTool<T>(
  page: Page,
  name: string,
  input: Record<string, unknown>,
): Promise<T> {
  return page.evaluate(
    async ({ toolName, toolInput }) => {
      const tools = (
        window as Window & { __aggyWebMcpTools: Record<string, WebMCP.ModelContextTool> }
      ).__aggyWebMcpTools;
      const tool = tools[toolName];
      if (!tool) throw new Error(`Missing tool: ${toolName}`);
      return (await tool.execute(toolInput, {
        signal: new AbortController().signal,
      })) as T;
    },
    { toolName: name, toolInput: input },
  );
}

test.beforeEach(async ({ page }) => {
  await installWebMcpMock(page);
  await page.goto("/app/");
  await waitForWasmReady(page);
  await uploadFiles(page);
  await proceedToAggregation(page);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Object.keys(
            (
              window as Window & {
                __aggyWebMcpTools: Record<string, WebMCP.ModelContextTool>;
              }
            ).__aggyWebMcpTools,
          ).length,
      ),
    )
    .toBe(11);
});

test("WebMCPとUIが同じ集計・Recipe状態を操作する", async ({ page }) => {
  const summary = await executeTool<{ rawData: { rows: number }; questions: { total: number } }>(
    page,
    "get_dataset_summary",
    {},
  );
  expect(summary.rawData.rows).toBeGreaterThan(0);
  expect(summary.questions.total).toBe(3);

  await executeTool(page, "set_cross_axis", { code: "q1", enabled: true });
  await page.getByRole("button", { name: /集計設定を開く/ }).click();
  const crossAxisGroup = page.getByRole("group", { name: /クロス集計軸の選択/ });
  await expect(crossAxisGroup.getByRole("checkbox").first()).toBeChecked();
  await expect(page.locator("table th", { hasText: "性別" }).first()).toBeVisible();

  const result = await executeTool<{
    question: { code: string };
    slice: { code: string; n: number };
  }>(page, "get_aggregation_result", {
    questionCode: "q2",
    crossAxisCode: "q1",
    sliceCode: "1",
  });
  expect(result.question.code).toBe("q2");
  expect(result.slice.code).toBe("1");
  expect(result.slice.n).toBeGreaterThan(0);

  await executeTool(page, "set_combine_sa_recipe", {
    code: "combined",
    label: "性別×満足度",
    sources: ["q1", "q2"],
  });
  await expect(page.getByRole("button", { name: /combined/ }).first()).toBeVisible();

  await executeTool(page, "delete_recipe", { code: "combined" });
  await expect(page.getByText("combined", { exact: true })).toHaveCount(0);
});
