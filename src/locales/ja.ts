const ja: Record<string, string> = {
  // Header
  "header.subtitle": "アンケート集計ツール β",
  "header.settings": "設定を開く",
  "header.back": "データ読み込みに戻る",

  // DuckDB status
  "wasm.loading": "DuckDB 読み込み中...",

  // Import screen
  "import.title": "データ読み込み",
  "import.history": "履歴",
  "import.step.select": "ファイル選択",
  "import.step.proceed": "集計へ",
  "import.proceed": "集計画面へ進む →",
  "import.start": "集計開始",

  // Validation step
  "validation.title": "データ検証",
  "validation.running": "検証中...",
  "validation.check.layoutStructure": "レイアウトJSONの構造が正しい",
  "validation.check.saCode": "SA列の回答コードがレイアウト定義と一致",
  "validation.check.columns": "レイアウト定義列がCSVに存在",
  "validation.check.maValues": "MA列の値が0/1のみ",
  "validation.check.numeric": "数値列が数値のみ",
  "validation.ok": "OK",
  "validation.error": "エラーあり",
  "validation.warn": "警告あり",
  "validation.detail.invalidLayout": "{key}: {reason}",
  "validation.detail.dropped": "{key}（{label}, {type}）がCSVに存在しません",
  "validation.detail.unknownCode": "{key}（{label}）に未定義コード: {codes}",
  "validation.detail.invalidMAValue": "{key}（{label}）のMA列に0/1以外の値: {values}",
  "validation.detail.nonNumeric": "{key}（{label}）に数値でない値が{count}件あります",
  "validation.fixPrompt": "ファイルを修正して再アップロードしてください",
  "validation.back": "ファイル選択に戻る",

  // Dropzone
  "dropzone.csv.icon": "ローデータ",
  "dropzone.csv.text": ".csv をドロップまたは選択",
  "dropzone.layout.icon": "レイアウト",
  "dropzone.layout.text": ".json をドロップまたは選択",

  // Saved files
  "saved.empty": "履歴なし",
  "saved.delete": "{name} を削除",

  // Aggregation screen
  "section.summary": "データ概要",
  "section.cross": "クロス集計軸",
  "section.cross.label": "クロス集計軸の選択",
  "summary.rows": "{rows} 行 {cols} 列",
  "weight.label": "ウェイトバック ({col})",
  "weight.on": "ON",
  "weight.off": "OFF",

  // Run button
  "run.button": "▶ 集計を実行",

  // Empty state
  "empty.text": "クロス集計軸を選んで集計を実行してください",

  // Results
  "result.title.tab": "集計結果",
  "result.meta": "{count} 問  ／  {weight}",
  "result.weight.applied": "ウェイトバック適用: {col}",
  "result.weight.none": "実数集計",
  "result.view.table": "テーブル",
  "result.view.chart": "チャート",
  "result.pct.column": "縦%",
  "result.pct.row": "横%",
  "result.csv.export": "全件CSV出力",

  // Export menu
  "export.label": "エクスポート",
  "export.section.copy": "コピー",
  "export.section.download": "ダウンロード",
  "export.copied": "コピーしました ✓",
  "export.header.variable": "変数名",
  "export.header.type": "種別",
  "export.header.option": "選択肢",
  "export.header.n": "n",
  "export.header.pct": "%",
  "export.header.total.n": "全体_n",
  "export.header.total.pct": "全体_%",
  "export.long.total": "(全体)",
  "export.long.crossAxis": "クロス軸",
  "export.long.crossValue": "クロス値",
  "export.long.count": "度数",
  "label.noAnswer": "無回答",

  // NA (Numerical Answer)
  "na.stat.n": "n",
  "na.stat.mean": "平均",
  "na.stat.median": "中央値",
  "na.stat.sd": "標準偏差",
  "na.stat.min": "最小",
  "na.stat.max": "最大",
  "na.binWidth": "階級幅",

  // Chart type
  "chart.barH": "横棒",
  "chart.barV": "縦棒",
  "chart.obi": "帯",
  "chart.palette": "配色",

  // Table headers
  "table.option": "選択肢",
  "table.graph": "グラフ",
  "table.total": "全体",
  "table.caption.tab": "{question} の集計結果",
  "table.caption.cross": "{question} のクロス集計結果",

  // AI Bubble
  "ai.close": "閉じる",
  "ai.header": "✨ AI分析",
  "ai.loading": "分析中...",

  // AI Prompt
  "ai.systemPrompt":
    "あなたはアンケート分析の専門家です。回答は必ず日本語で2〜3文以内にしてください。",
  "ai.userPrompt":
    "上記の集計結果の注目すべき傾向を2〜3文で短く述べてください。箇条書き・見出し・提案・注意点は不要です。",
  "ai.weight": "※ウェイト列: {col}",
  "ai.moreItems": "...他{count}件",

  // Warnings
  "warn.date.cast": "{col}: {count}件の日付データを変換できませんでした",

  // Errors
  "error.csv.load": "ローデータファイルの読み込みエラー: {msg}",
  "error.layout.load": "レイアウトファイルの読み込みエラー: {msg}",
  "error.saved.load": "履歴データの読み込みエラー: {msg}",
  "error.aggregation": "集計エラー: {msg}",
  "error.date.prepare": "日付カラムの準備エラー: {msg}",

  // Getting Started modal
  "gs.close": "閉じる",
  "gs.title": "Aggyへようこそ",
  "gs.section1.title": "インポートファイルの準備",
  "gs.section1.p1":
    "本ツールでは、アンケートの<strong>ローデータファイル</strong>（CSV）と<strong>レイアウトファイル</strong>（JSON）の2つを読み込んで集計を行います。",
  "gs.section1.p2":
    "ファイルの変換・整形は<strong>ユーザーご自身</strong>で行ってください。<br>専用の <strong>Agent Skill</strong> も準備中です。公開後はお使いのAIツールに変換作業を任せることができるようになります。",
  "gs.section1.sample": "まずは<strong>サンプルファイル</strong>で試してみましょう：",
  "gs.section1.sampleCsv": "サンプルローデータ",
  "gs.section1.sampleLayout": "サンプルレイアウト",
  "gs.section2.title": "セキュリティについて",
  "gs.section2.p1":
    "Aggyは<strong>完全サーバーレス</strong>で動作します。すべての処理はお使いのブラウザ内で完結し、アップロードしたデータが外部サーバーに送信されることは一切ありません。",
  "gs.section3.title": "基本的な使い方",
  "gs.section3.step1": "ローデータファイルとレイアウトファイルを読み込む",
  "gs.section3.step2": "必要に応じてクロス集計軸を選択する",
  "gs.section3.step3": "「集計を実行」ボタンをクリック",
  "gs.dismiss": "今後表示しない",
  "gs.ok": "はじめる",

  // Help button
  "help.label": "使い方ガイドを開く",
  "help.button": "使い方",

  // Settings modal
  "settings.title": "設定",
  "settings.language": "言語",
  "settings.theme": "テーマ",
  "settings.theme.light": "ライト",
  "settings.theme.dark": "ダーク",
  "settings.theme.system": "システム設定に従う",
  "settings.ai": "AI分析コメント",
  "settings.ai.on": "ON",
  "settings.ai.off": "OFF",
  "settings.close": "閉じる",

  // Dashboard
  "dashboard.title": "ダッシュボード",
  "dashboard.overview": "調査概要",
  "dashboard.overview.responses": "回答数",
  "dashboard.overview.questions": "設問数",
  "dashboard.overview.choice": "選択式設問",
  "dashboard.overview.numeric": "数値設問",
  "dashboard.notable": "特徴的な設問",
  "dashboard.notable.description": "回答の偏りが大きい設問（低エントロピー）を自動検出しています",
  "dashboard.notable.score": "偏りスコア",
  "dashboard.notable.empty": "対象となる設問がありません",
  "dashboard.segment.title": "セグメント間差異",
  "dashboard.segment.description":
    "クロス集計でセグメント間の差が大きい設問（クラメールのV ≥ 0.3）",

  // Toolbar
  "toolbar.crossAxis": "クロス集計軸",

  // Changelog
  "changelog.title": "更新情報",
};

export default ja;
