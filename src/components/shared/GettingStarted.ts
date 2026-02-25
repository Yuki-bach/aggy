const STORAGE_KEY = "temotto-getting-started-dismissed";

function buildModalHTML(): string {
  return `
    <div class="modal-content" role="document">
      <button class="modal-close" id="gs-close" aria-label="閉じる">&times;</button>
      <h2 id="gs-title" class="modal-title">Temottoへようこそ</h2>

      <div class="modal-body">
        <section class="modal-section">
          <h3>インポートファイルの準備</h3>
          <p>
            本ツールでは、アンケートの<strong>ローデータファイル</strong>（CSV）と
            <strong>レイアウトファイル</strong>（JSON）の2つを読み込んで集計を行います。
          </p>
          <p>
            ファイルの変換・整形は<strong>ユーザーご自身</strong>で行ってください。<br>
            専用の <strong>Agent Skill</strong> を用意していますので、
            お使いのAIツールに変換作業を任せることができます。
          </p>
          <div class="modal-sample-downloads">
            <p>まずは<strong>サンプルファイル</strong>で試してみましょう：</p>
            <div class="modal-sample-links">
              <a href="samples/sample_data.csv" download="sample_data.csv" class="modal-sample-link">
                <span class="modal-sample-icon">&#128196;</span>
                サンプルローデータ
              </a>
              <a href="samples/sample_layout.json" download="sample_layout.json" class="modal-sample-link">
                <span class="modal-sample-icon">&#128196;</span>
                サンプルレイアウト
              </a>
            </div>
          </div>
        </section>

        <section class="modal-section">
          <h3>セキュリティについて</h3>
          <p>
            Temottoは<strong>完全サーバーレス</strong>で動作します。
            すべての処理はお使いのブラウザ内で完結し、
            アップロードしたデータが外部サーバーに送信されることは一切ありません。
          </p>
        </section>

        <section class="modal-section">
          <h3>基本的な使い方</h3>
          <ol>
            <li>ローデータファイルとレイアウトファイルを読み込む</li>
            <li>必要に応じてクロス集計軸を選択する</li>
            <li>「集計を実行」ボタンをクリック</li>
          </ol>
        </section>
      </div>

      <div class="modal-footer">
        <label class="modal-dismiss-label">
          <input type="checkbox" id="gs-dismiss-check">
          今後表示しない
        </label>
        <button class="modal-ok-btn" id="gs-ok">はじめる</button>
      </div>
    </div>
  `;
}

function show(): void {
  const modal = document.getElementById("getting-started-modal")!;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  // フォーカスをモーダル内に移動
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

export function initGettingStarted(): void {
  const modal = document.getElementById("getting-started-modal")!;
  modal.innerHTML = buildModalHTML();

  // 閉じるボタン
  document.getElementById("gs-close")!.addEventListener("click", hide);
  document.getElementById("gs-ok")!.addEventListener("click", hide);

  // 背景クリックで閉じる
  modal.addEventListener("click", (e) => {
    if (e.target === modal) hide();
  });

  // ESCキーで閉じる
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      hide();
    }
  });

  // ヘッダーの「?」ボタン
  document.getElementById("help-btn")!.addEventListener("click", show);
}
