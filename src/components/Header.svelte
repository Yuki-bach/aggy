<script lang="ts">
  import { t } from "../lib/i18n.svelte";
  import SettingsModal from "./header/SettingsModal.svelte";
  import IconButton from "./shared/IconButton.svelte";
  import WasmStatus from "./header/WasmStatus.svelte";
  import ChangelogButton from "./header/ChangelogButton.svelte";

  interface Props {
    isImport: boolean;
    onBack: () => void;
  }

  let { isImport, onBack }: Props = $props();
</script>

<header class="flex items-center gap-4 border-b border-border bg-surface px-6 py-4">
  {#if !isImport}
    <IconButton size="md" label={t("header.back")} onclick={onBack}>
      &larr;
    </IconButton>
  {/if}
  <h1 class="text-lg font-bold text-text">Aggy</h1>
  <span class="text-xs tracking-widest text-muted">{t("header.subtitle")}</span>
  <div class="relative ml-auto flex items-center gap-3">
    <WasmStatus />
    <ChangelogButton />
    <SettingsModal />
  </div>
</header>
