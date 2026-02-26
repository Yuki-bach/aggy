import { render } from "preact";
import { useRef } from "preact/hooks";
import { t, onLocaleChange } from "../../lib/i18n";

const STORAGE_KEY = "aggy-getting-started-dismissed";

function GettingStartedContent({ onClose }: { onClose: () => void }) {
  const checkRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (checkRef.current?.checked) {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    onClose();
  };

  return (
    <div
      class="relative w-full max-w-[600px] max-h-[85vh] overflow-y-auto rounded-lg border border-border bg-surface p-8 shadow-[0_8px_32px_rgba(0,0,0,0.18)] animate-[slideUp_0.25s_ease] max-md:max-h-[90vh] max-md:p-5"
      role="document"
    >
      <button
        class="absolute top-3 right-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded border-none bg-transparent text-2xl leading-none text-text-secondary hover:bg-surface2 hover:text-text"
        aria-label={t("gs.close")}
        onClick={handleClose}
      >
        &times;
      </button>
      <h2 id="gs-title" class="m-0 mb-6 pr-8 text-[1.375rem] font-bold text-text">
        {t("gs.title")}
      </h2>

      <div class="text-[0.9375rem] leading-[1.7] text-text">
        <section class="mb-5 last:mb-0 [&_h3]:m-0 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-accent [&_h3]:dark:text-accent-light [&_p]:m-0 [&_p]:mb-2 [&_ol]:mt-2 [&_ol]:pl-6 [&_ol_li]:mb-1">
          <h3>{t("gs.section1.title")}</h3>
          <p>{t("gs.section1.p1")}</p>
          <p>{t("gs.section1.p2")}</p>
          <div class="mt-3 rounded border border-border bg-surface2 px-4 py-3">
            <p>{t("gs.section1.sample")}</p>
            <div class="flex gap-3">
              <a
                href="samples/sample_data.csv"
                download="sample_data.csv"
                class="inline-flex items-center gap-1 rounded border border-border-strong bg-surface px-3 py-1 text-[0.8125rem] font-semibold text-accent no-underline transition-[background,border-color] duration-150 hover:border-accent hover:bg-accent-bg dark:bg-surface2 dark:border-accent dark:hover:bg-[var(--color-gray-300)]"
              >
                <span class="text-base">{"\u{1F4C4}"}</span>
                {t("gs.section1.sampleCsv")}
              </a>
              <a
                href="samples/sample_layout.json"
                download="sample_layout.json"
                class="inline-flex items-center gap-1 rounded border border-border-strong bg-surface px-3 py-1 text-[0.8125rem] font-semibold text-accent no-underline transition-[background,border-color] duration-150 hover:border-accent hover:bg-accent-bg dark:bg-surface2 dark:border-accent dark:hover:bg-[var(--color-gray-300)]"
              >
                <span class="text-base">{"\u{1F4C4}"}</span>
                {t("gs.section1.sampleLayout")}
              </a>
            </div>
          </div>
        </section>

        <section class="mb-5 last:mb-0 [&_h3]:m-0 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-accent [&_h3]:dark:text-accent-light [&_p]:m-0 [&_p]:mb-2">
          <h3>{t("gs.section2.title")}</h3>
          <p>{t("gs.section2.p1")}</p>
        </section>

        <section class="mb-5 last:mb-0 [&_h3]:m-0 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-accent [&_h3]:dark:text-accent-light [&_ol]:mt-2 [&_ol]:pl-6 [&_ol_li]:mb-1">
          <h3>{t("gs.section3.title")}</h3>
          <ol>
            <li>{t("gs.section3.step1")}</li>
            <li>{t("gs.section3.step2")}</li>
            <li>{t("gs.section3.step3")}</li>
          </ol>
        </section>
      </div>

      <div class="mt-6 flex items-center justify-between border-t border-border pt-4">
        <label class="flex cursor-pointer items-center gap-2 text-[0.8125rem] text-text-secondary">
          <input type="checkbox" ref={checkRef} />
          {t("gs.dismiss")}
        </label>
        <button
          class="cursor-pointer rounded border-none bg-[var(--color-primary-600)] px-6 py-2 text-[0.9375rem] font-semibold text-[var(--color-white)] transition-[background] duration-150 hover:bg-accent"
          data-autofocus
          onClick={handleClose}
        >
          {t("gs.ok")}
        </button>
      </div>
    </div>
  );
}

function show(): void {
  const modal = document.getElementById("getting-started-modal")!;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  // Focus OK button after render
  requestAnimationFrame(() => {
    modal.querySelector<HTMLButtonElement>("[data-autofocus]")?.focus();
  });
}

function hide(): void {
  const modal = document.getElementById("getting-started-modal")!;
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function renderModal(): void {
  const modal = document.getElementById("getting-started-modal")!;
  render(<GettingStartedContent onClose={hide} />, modal);
}

export function initGettingStarted(): void {
  renderModal();

  const modal = document.getElementById("getting-started-modal")!;
  modal.addEventListener("click", (e) => {
    if (e.target === modal) hide();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      hide();
    }
  });

  document.getElementById("help-btn")!.addEventListener("click", show);

  onLocaleChange(() => renderModal());
}
