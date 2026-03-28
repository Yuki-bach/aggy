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

        <section class="mb-5 last:mb-0">
          <h3 class="m-0 mb-2 text-base font-bold text-accent dark:text-accent-light">
            {t("gs.section4.title")}
          </h3>
          <p class="m-0 mb-3 text-text-secondary">{t("gs.section4.desc")}</p>
          <div class="flex gap-3">
            <a
              href="https://github.com/Yuki-bach/aggy/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 rounded border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-accent hover:bg-accent-bg dark:bg-surface2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              {t("gs.section4.mac")}
            </a>
            <a
              href="https://github.com/Yuki-bach/aggy/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 rounded border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-accent hover:bg-accent-bg dark:bg-surface2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              {t("gs.section4.windows")}
            </a>
          </div>
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
