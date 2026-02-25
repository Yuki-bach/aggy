const ja: Record<string, string> = {
  // Header
  "header.subtitle": "アンケート集計ツール v0.1",
  "header.settings": "設定を開く",
  "header.back": "データ読み込みに戻る",

  // DuckDB status
  "wasm.loading": "DuckDB 読み込み中...",

  // Import screen
  "import.title": "データ読み込み",
  "import.tab.file": "ファイルから",
  "import.tab.saved": "履歴から",
  "import.tab.label": "データ読み込み方法",
  "import.proceed": "集計画面へ進む →",

  // Dropzone
  "dropzone.csv.icon": "ローデータ",
  "dropzone.csv.text": "ここにローデータファイル(csv)をドロップ",
  "dropzone.csv.hint": "またはクリックして選択",
  "dropzone.layout.icon": "レイアウト",
  "dropzone.layout.text": "ここにレイアウトファイル(json)をドロップ",
  "dropzone.layout.hint": "またはクリックして選択",

  // Saved files
  "saved.empty": "履歴なし",
  "saved.delete": "{name} を削除",

  // Aggregation screen
  "section.summary": "データ概要",
  "section.cross": "クロス集計軸（任意）",
  "section.cross.label": "クロス集計軸の選択",
  "summary.rawdata": "ローデータ",
  "summary.layout": "レイアウト",
  "summary.rows": "{rows} 行 / {cols} 列",
  "summary.colDefs": "{count} 列定義",
  "weight.label": "⚖ ウェイト列: {col}",

  // Loaded info (import screen)
  "loaded.csv": "ローデータ: {name}  —  {rows} 行 / {cols} 列",
  "loaded.layout": "レイアウト: {name}  —  {count} 列定義",

  // Run button
  "run.button": "▶ 集計を実行",

  // Empty state
  "empty.text": "クロス集計軸を選んで集計を実行してください",

  // Results
  "result.title.gt": "集計結果",
  "result.title.cross": "クロス集計結果",
  "result.meta": "{count} 問  ／  {weight}",
  "result.weight.applied": "ウェイトバック適用: {col}",
  "result.weight.none": "実数集計",
  "result.view.table": "テーブル",
  "result.view.chart": "チャート",
  "result.csv.export": "全件CSV出力",

  // Chart type
  "chart.barH": "横棒",
  "chart.barV": "縦棒",
  "chart.obi": "帯",

  // Table headers
  "table.option": "選択肢",
  "table.graph": "グラフ",
  "table.total": "全体",
  "table.caption.gt": "{question} の集計結果",
  "table.caption.cross": "{question} のクロス集計結果",

  // Weight suffix
  "n.weighted": "（ウェイト後）",

  // AI Bubble
  "ai.close": "閉じる",
  "ai.header": "✨ AI分析",
  "ai.loading": "分析中...",

  // Errors
  "error.csv.load": "ローデータファイルの読み込みエラー: {msg}",
  "error.layout.load": "レイアウトファイルの読み込みエラー: {msg}",
  "error.saved.load": "履歴データの読み込みエラー: {msg}",
  "error.aggregation": "集計エラー: {msg}",

  // Getting Started modal
  "gs.close": "閉じる",
  "gs.title": "Temottoへようこそ",
  "gs.section1.title": "インポートファイルの準備",
  "gs.section1.p1":
    "本ツールでは、アンケートの<strong>ローデータファイル</strong>（CSV）と<strong>レイアウトファイル</strong>（JSON）の2つを読み込んで集計を行います。",
  "gs.section1.p2":
    "ファイルの変換・整形は<strong>ユーザーご自身</strong>で行ってください。<br>専用の <strong>Agent Skill</strong> を用意していますので、お使いのAIツールに変換作業を任せることができます。",
  "gs.section1.sample": "まずは<strong>サンプルファイル</strong>で試してみましょう：",
  "gs.section1.sampleCsv": "サンプルローデータ",
  "gs.section1.sampleLayout": "サンプルレイアウト",
  "gs.section2.title": "セキュリティについて",
  "gs.section2.p1":
    "Temottoは<strong>完全サーバーレス</strong>で動作します。すべての処理はお使いのブラウザ内で完結し、アップロードしたデータが外部サーバーに送信されることは一切ありません。",
  "gs.section3.title": "基本的な使い方",
  "gs.section3.step1": "ローデータファイルとレイアウトファイルを読み込む",
  "gs.section3.step2": "必要に応じてクロス集計軸を選択する",
  "gs.section3.step3": "「集計を実行」ボタンをクリック",
  "gs.dismiss": "今後表示しない",
  "gs.ok": "はじめる",

  // Help button
  "help.label": "使い方ガイド",

  // Settings modal
  "settings.title": "設定",
  "settings.language": "言語",
  "settings.theme": "テーマ",
  "settings.theme.light": "ライト",
  "settings.theme.dark": "ダーク",
  "settings.theme.system": "システム設定に従う",
  "settings.close": "閉じる",
};

export default ja;
