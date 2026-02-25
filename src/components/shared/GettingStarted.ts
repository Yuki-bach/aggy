import { t, onLocaleChange } from "../../lib/i18n";
import { escHtml } from "./escHtml";

const STORAGE_KEY = "aggy-getting-started-dismissed";

function buildModalHTML(): string {
  return `
    <div class="modal-content" role="document">
      <button class="modal-close" id="gs-close" aria-label="${escHtml(t("gs.close"))}">&times;</button>
      <h2 id="gs-title" class="modal-title">${t("gs.title")}</h2>

      <div class="modal-body">
        <section class="modal-section">
          <h3>${t("gs.section1.title")}</h3>
          <p>${t("gs.section1.p1")}</p>
          <p>${t("gs.section1.p2")}</p>
          <div class="modal-sample-downloads">
            <p>${t("gs.section1.sample")}</p>
            <div class="modal-sample-links">
              <a href="samples/sample_data.csv" download="sample_data.csv" class="modal-sample-link">
                <span class="modal-sample-icon">&#128196;</span>
                ${t("gs.section1.sampleCsv")}
              </a>
              <a href="samples/sample_layout.json" download="sample_layout.json" class="modal-sample-link">
                <span class="modal-sample-icon">&#128196;</span>
                ${t("gs.section1.sampleLayout")}
              </a>
            </div>
          </div>
        </section>

        <section class="modal-section">
          <h3>${t("gs.section2.title")}</h3>
          <p>${t("gs.section2.p1")}</p>
        </section>

        <section class="modal-section">
          <h3>${t("gs.section3.title")}</h3>
          <ol>
            <li>${t("gs.section3.step1")}</li>
            <li>${t("gs.section3.step2")}</li>
            <li>${t("gs.section3.step3")}</li>
          </ol>
        </section>
      </div>

      <div class="modal-footer">
        <label class="modal-dismiss-label">
          <input type="checkbox" id="gs-dismiss-check">
          ${t("gs.dismiss")}
        </label>
        <button class="modal-ok-btn" id="gs-ok">${t("gs.ok")}</button>
      </div>
    </div>
  `;
}

function show(): void {
  const modal = document.getElementById("getting-started-modal")!;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  (document.getElementById("gs-ok") as HTMLButtonElement).focus();
}

function hide(): void {
  const modal = document.getElementById("getting-started-modal")!;
  modal.classList.add("hidden");
  document.body.style.overflow = "";

  const check = document.getElementById("gs-dismiss-check") as HTMLInputElement;
  if (check.checked) {
    localStorage.setItem(STORAGE_KEY, "1");
  }
}

function rebuildModal(): void {
  const modal = document.getElementById("getting-started-modal")!;
  modal.innerHTML = buildModalHTML();
  document.getElementById("gs-close")!.addEventListener("click", hide);
  document.getElementById("gs-ok")!.addEventListener("click", hide);
}

export function initGettingStarted(): void {
  rebuildModal();

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

  onLocaleChange(() => rebuildModal());
}
