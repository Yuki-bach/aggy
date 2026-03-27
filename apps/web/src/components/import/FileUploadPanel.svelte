<script lang="ts">
  import { t } from "../../lib/i18n.svelte";
  import Dropzone from "./Dropzone.svelte";

  interface Props {
    rawDataFileName: string | null;
    layoutFileName: string | null;
    onRawDataFile: (file: File) => void;
    onLayoutFile: (file: File) => void;
  }

  let { rawDataFileName, layoutFileName, onRawDataFile, onLayoutFile }: Props = $props();
</script>

<div class="flex flex-col gap-3 md:flex-row">
  <div class="flex-1">
    <Dropzone
      accept=".csv"
      icon={t("dropzone.csv.icon")}
      text={t("dropzone.csv.text")}
      loadedFileName={rawDataFileName}
      onFile={onRawDataFile}
    />
  </div>
  <div class="flex-1">
    <Dropzone
      accept=".json"
      icon={t("dropzone.layout.icon")}
      text={t("dropzone.layout.text")}
      loadedFileName={layoutFileName}
      onFile={onLayoutFile}
    />
  </div>
</div>
