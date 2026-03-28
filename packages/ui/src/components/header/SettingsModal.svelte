<script lang="ts">
  import { t, getLocale, setLocale } from "../../lib/i18n.svelte";
  import {
    isAICommentEnabled,
    setAIComment,
    applyTheme,
    getStoredTheme,
    type Theme,
  } from "../../lib/theme";
  import Dropdown from "../shared/Dropdown.svelte";
  import IconButton from "../shared/IconButton.svelte";

  let open = $state(false);
  let aiAvailable = $state(false);
  let tick = $state(0);

  // System theme change listener
  $effect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (getStoredTheme() === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  });

  async function handleToggle(e: MouseEvent) {
    e.stopPropagation();
    if (open) {
      open = false;
    } else {
      if (typeof LanguageModel !== "undefined" && (await LanguageModel.availability()) !== "no") {
        aiAvailable = true;
      }
      open = true;
    }
  }

  function rerender() {
    tick++;
  }

  let locale = $derived.by(() => {
    void tick;
    return getLocale();
  });
  let theme = $derived.by(() => {
    void tick;
    return getStoredTheme();
  });
  let aiEnabled = $derived.by(() => {
    void tick;
    return isAICommentEnabled();
  });
</script>

<Dropdown {open} onclose={() => (open = false)}>
  {#snippet trigger()}
    <IconButton
      size="md"
      id="settings-btn"
      label={t("header.settings")}
      data-i18n="header.settings"
      data-i18n-attr="aria-label"
      onclick={handleToggle}
    >
      &#x2699;
    </IconButton>
  {/snippet}
      <!-- Language -->
      <div class="mb-4 last:mb-0">
        <span class="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
          {t("settings.language")}
        </span>
        <div class="flex gap-0.5 rounded-lg bg-surface2 p-0.5" data-seg-name="lang">
          {#each [{ value: "ja", label: "日本語" }, { value: "en", label: "English" }] as o (o.value)}
            <button
              class="flex-1 cursor-pointer whitespace-nowrap rounded-md border-none px-3 py-1 text-xs transition-[background,color,box-shadow] duration-150 hover:text-text {o.value ===
              locale
                ? 'bg-surface text-text shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                : 'bg-transparent text-muted'}"
              onclick={(e: MouseEvent) => {
                e.stopPropagation();
                setLocale(o.value);
                rerender();
              }}
            >
              {o.label}
            </button>
          {/each}
        </div>
      </div>

      <!-- Theme -->
      <div class="mb-4 last:mb-0">
        <span class="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
          {t("settings.theme")}
        </span>
        <div class="flex gap-0.5 rounded-lg bg-surface2 p-0.5" data-seg-name="theme">
          {#each [{ value: "light", label: t("settings.theme.light") }, { value: "dark", label: t("settings.theme.dark") }, { value: "system", label: t("settings.theme.system") }] as o (o.value)}
            <button
              class="flex-1 cursor-pointer whitespace-nowrap rounded-md border-none px-3 py-1 text-xs transition-[background,color,box-shadow] duration-150 hover:text-text {o.value ===
              theme
                ? 'bg-surface text-text shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                : 'bg-transparent text-muted'}"
              onclick={(e: MouseEvent) => {
                e.stopPropagation();
                applyTheme(o.value as Theme);
                rerender();
              }}
            >
              {o.label}
            </button>
          {/each}
        </div>
      </div>

      <!-- AI Comments -->
      {#if aiAvailable}
        <div class="mb-4 last:mb-0">
          <span class="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">
            {t("settings.ai")}
          </span>
          <div class="flex gap-0.5 rounded-lg bg-surface2 p-0.5" data-seg-name="ai">
            {#each [{ value: "on", label: t("settings.ai.on") }, { value: "off", label: t("settings.ai.off") }] as o (o.value)}
              <button
                class="flex-1 cursor-pointer whitespace-nowrap rounded-md border-none px-3 py-1 text-xs transition-[background,color,box-shadow] duration-150 hover:text-text {(aiEnabled ? 'on' : 'off') ===
                o.value
                  ? 'bg-surface text-text shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                  : 'bg-transparent text-muted'}"
                onclick={(e: MouseEvent) => {
                  e.stopPropagation();
                  setAIComment(o.value === "on");
                  rerender();
                }}
              >
                {o.label}
              </button>
            {/each}
          </div>
        </div>
      {/if}
</Dropdown>
