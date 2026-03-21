import { useEffect } from "preact/hooks";
import { t, getLocale } from "../../lib/i18n";
import { useLocaleRerender, useDismiss } from "../../lib/hooks";

export function GettingStartedModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useLocaleRerender();
  useDismiss(open, onClose);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal={true}
      aria-labelledby="gs-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <GettingStartedContent onClose={onClose} />
    </div>
  );
}

// ─── Internal ───────────────────────────────────────────────

function SampleLink({ href, name, children }: { href: string; name: string; children: string }) {
  return (
    <a
      href={href}
      download={name}
      class="flex items-center gap-1 rounded border border-border-strong bg-surface px-3 py-1 text-xs font-semibold text-accent transition-colors hover:border-accent hover:bg-accent-bg dark:bg-surface2 dark:border-accent"
    >
      <span class="text-base">{"\u{1F4C4}"}</span>
      {children}
    </a>
  );
}

function GettingStartedContent({ onClose }: { onClose: () => void }) {
  return (
    <div
      class="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-lg border border-border bg-surface p-8 shadow-xl max-md:max-h-[90vh] max-md:p-5"
      role="document"
    >
      <button
        class="absolute top-3 right-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded text-2xl leading-none text-text-secondary hover:bg-surface2 hover:text-text"
        aria-label={t("gs.close")}
        onClick={onClose}
      >
        &times;
      </button>
      <h2 id="gs-title" class="m-0 mb-6 pr-8 text-xl font-bold text-text">
        {t("gs.title")}
      </h2>

      <div class="text-sm leading-relaxed text-text">
        <section class="mb-5 last:mb-0">
          <h3 class="m-0 mb-2 text-base font-bold text-accent dark:text-accent-light">
            {t("gs.section1.title")}
          </h3>
          <p class="m-0 mb-2" dangerouslySetInnerHTML={{ __html: t("gs.section1.p1") }} />
          <p class="m-0 mb-2" dangerouslySetInnerHTML={{ __html: t("gs.section1.p2") }} />
          <div class="mt-3 rounded border border-border bg-surface2 px-4 py-3">
            <p class="m-0 mb-2" dangerouslySetInnerHTML={{ __html: t("gs.section1.sample") }} />
            <div class="flex gap-3">
              <SampleLink href="samples/sample_data.csv" name="sample_data.csv">
                {t("gs.section1.sampleCsv")}
              </SampleLink>
              <SampleLink
                href={
                  getLocale() === "ja"
                    ? "samples/sample_layout.json"
                    : "samples/sample_layout_en.json"
                }
                name="sample_layout.json"
              >
                {t("gs.section1.sampleLayout")}
              </SampleLink>
            </div>
          </div>
        </section>

        <section class="mb-5 last:mb-0">
          <h3 class="m-0 mb-2 text-base font-bold text-accent dark:text-accent-light">
            {t("gs.section2.title")}
          </h3>
          <p class="m-0 mb-2" dangerouslySetInnerHTML={{ __html: t("gs.section2.p1") }} />
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
          onClick={onClose}
        >
          {t("gs.ok")}
        </button>
      </div>
    </div>
  );
}
