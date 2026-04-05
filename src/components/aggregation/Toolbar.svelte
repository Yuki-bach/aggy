<script lang="ts">
  import type { Tab } from "../../lib/types";
  import { t } from "../../lib/i18n.svelte";
  import ToggleButton from "../shared/ToggleButton.svelte";
  import ToggleGroup from "../shared/ToggleGroup.svelte";
  import ExportMenu from "./ExportMenu.svelte";
  import { executeExport, type ExportAction } from "../../lib/export/export";
  import type { ViewMode } from "./viewTypes";
  import type { ToolbarCallbacks } from "./toolbarTypes";

  interface Props {
    tabs: Tab[];
    weightCol: string;
    currentViewMode: ViewMode;
    callbacks: ToolbarCallbacks;
  }

  let { tabs, weightCol, currentViewMode, callbacks }: Props = $props();

  let weightText = $derived(
    weightCol
      ? t("result.weight.applied", { col: weightCol })
      : t("result.weight.none"),
  );
  let questionCount = $derived(new Set(tabs.map((tab) => tab.questionCode)).size);
</script>

<div class="mb-6 flex items-center gap-4">
  <h2 class="text-xl font-bold">{t("result.title.tab")}</h2>
  <span class="text-xs text-muted">
    {t("result.meta", { count: questionCount, weight: weightText })}
  </span>

  <ToggleGroup class="ml-auto">
    <ToggleButton
      active={currentViewMode === "table"}
      onclick={() => currentViewMode !== "table" && callbacks.onViewModeChange("table")}
    >
      {t("result.view.table")}
    </ToggleButton>
    <ToggleButton
      active={currentViewMode === "chart"}
      onclick={() => currentViewMode !== "chart" && callbacks.onViewModeChange("chart")}
    >
      {t("result.view.chart")}
    </ToggleButton>
  </ToggleGroup>

  <ExportMenu onExport={(action: ExportAction) => executeExport(action, tabs, weightCol)} />
</div>
