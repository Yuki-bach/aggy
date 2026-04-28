<script lang="ts">
  import { t, getLocale } from "../../lib/i18n.svelte";
  import IconButton from "../shared/IconButton.svelte";

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open, onClose }: Props = $props();

  $effect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  });
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby="gs-title"
    onclick={(e: MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    }}
    onkeydown={(e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    }}
  >
    <div
      class="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-lg border border-border bg-surface p-8 shadow-xl max-md:max-h-[90vh] max-md:p-5"
      role="document"
    >
      <div class="absolute top-3 right-3 text-2xl leading-none">
        <IconButton size="sm" label={t("gs.close")} onclick={onClose}>
          &times;
        </IconButton>
      </div>
      <h2 id="gs-title" class="m-0 mb-6 pr-8 text-xl font-bold text-text">
        {t("gs.title")}
      </h2>

      <div class="text-sm leading-relaxed text-text">
        <section class="mb-5 last:mb-0">
          <h3 class="m-0 mb-2 text-base font-bold text-accent dark:text-accent-light">
            {t("gs.section1.title")}
          </h3>
          <p class="m-0 mb-2">{@html t("gs.section1.p1")}</p>
          <p class="m-0 mb-2">{@html t("gs.section1.p2")}</p>
          <div class="mt-3 rounded border border-border bg-surface2 px-4 py-3">
            <p class="m-0 mb-2">{@html t("gs.section1.sample")}</p>
            <div class="flex gap-3">
              <a
                href="samples/sample_data.csv"
                download="sample_data.csv"
                class="flex items-center gap-1 rounded border border-border-strong bg-surface px-3 py-1 text-xs font-semibold text-accent transition-colors hover:border-accent hover:bg-accent-bg dark:bg-surface2 dark:border-accent"
              >
                <span class="text-base">{"\u{1F4C4}"}</span>
                {t("gs.section1.sampleCsv")}
              </a>
              <a
                href={getLocale() === "ja"
                  ? "samples/sample_layout.json"
                  : "samples/sample_layout_en.json"}
                download="sample_layout.json"
                class="flex items-center gap-1 rounded border border-border-strong bg-surface px-3 py-1 text-xs font-semibold text-accent transition-colors hover:border-accent hover:bg-accent-bg dark:bg-surface2 dark:border-accent"
              >
                <span class="text-base">{"\u{1F4C4}"}</span>
                {t("gs.section1.sampleLayout")}
              </a>
            </div>
          </div>
        </section>

        <section class="mb-5 last:mb-0">
          <h3 class="m-0 mb-2 text-base font-bold text-accent dark:text-accent-light">
            {t("gs.section2.title")}
          </h3>
          <p class="m-0 mb-2">{@html t("gs.section2.p1")}</p>
        </section>

        <section class="mb-5 last:mb-0">
          <h3 class="m-0 mb-2 text-base font-bold text-accent dark:text-accent-light">
            {t("gs.section3.title")}
          </h3>
          <ol class="mt-2 pl-6 [&_li]:mb-1">
            <li>{t("gs.section3.step1")}</li>
            <li>{t("gs.section3.step2")}</li>
            <li>{t("gs.section3.step3")}</li>
          </ol>
        </section>
      </div>

      <div class="mt-6 flex items-center justify-end border-t border-border pt-4">
        <button
          class="cursor-pointer rounded bg-accent px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
          data-autofocus
          onclick={onClose}
        >
          {t("gs.ok")}
        </button>
      </div>
    </div>
  </div>
{/if}
