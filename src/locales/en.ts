const en: Record<string, string> = {
  // Header
  "header.subtitle": "SURVEY AGGREGATOR v0.1",
  "header.settings": "Open settings",
  "header.back": "Back to data import",

  // DuckDB status
  "wasm.loading": "Loading DuckDB...",

  // Import screen
  "import.title": "Load Data",
  "import.history": "History",
  "import.step.select": "Select Files",
  "import.step.proceed": "Aggregate",
  "import.proceed": "Proceed to Aggregation →",

  // Dropzone
  "dropzone.csv.icon": "Raw Data",
  "dropzone.csv.text": "Drop or select .csv",
  "dropzone.layout.icon": "Layout",
  "dropzone.layout.text": "Drop or select .json",

  // Saved files
  "saved.empty": "No history",
  "saved.delete": "Delete {name}",

  // Aggregation screen
  "section.summary": "Data Summary",
  "section.cross": "Cross-Tabulation Axes",
  "section.cross.label": "Cross-tabulation axis selection",
  "summary.rows": "{rows} rows {cols} cols",
  "weight.label": "Weight-back ({col})",
  "weight.on": "ON",
  "weight.off": "OFF",

  // Run button
  "run.button": "▶ Run Aggregation",

  // Empty state
  "empty.text": "Select cross-tabulation axes and run the aggregation",

  // Results
  "result.title.gt": "Aggregation Results",
  "result.meta": "{count} questions  /  {weight}",
  "result.weight.applied": "Weighted: {col}",
  "result.weight.none": "Unweighted",
  "result.view.table": "Table",
  "result.view.chart": "Chart",
  "result.pct.vertical": "Col %",
  "result.pct.horizontal": "Row %",
  "result.csv.export": "Export All CSV",

  // Export menu
  "export.label": "Export ▼",
  "export.section.copy": "Copy",
  "export.section.download": "Download",
  "export.copy.tsv": "Table (TSV)",
  "export.copy.markdown": "Markdown",
  "export.copy.json": "JSON",
  "export.download.csv": "CSV",
  "export.download.markdown": "Markdown",
  "export.download.json": "JSON",
  "export.copied": "Copied ✓",

  // Chart type
  "chart.barH": "Horizontal Bar",
  "chart.barV": "Vertical Bar",
  "chart.obi": "Stacked",
  "chart.palette": "Color",

  // Table headers
  "table.option": "Option",
  "table.graph": "Graph",
  "table.total": "Total",
  "table.caption.gt": "Aggregation results for {question}",
  "table.caption.cross": "Cross-tabulation results for {question}",

  // AI Bubble
  "ai.close": "Close",
  "ai.header": "✨ AI Analysis",
  "ai.loading": "Analyzing...",

  // AI Prompt
  "ai.systemPrompt":
    "You are a survey analysis expert. Keep your response to 2-3 sentences in English.",
  "ai.userPrompt":
    "Briefly describe notable trends in the aggregation results above in 2-3 sentences. No bullet points, headings, suggestions, or caveats.",
  "ai.weight": "* Weight column: {col}",
  "ai.moreItems": "...{count} more",

  // Errors
  "error.csv.load": "Error loading raw data file: {msg}",
  "error.layout.load": "Error loading layout file: {msg}",
  "error.saved.load": "Error loading history data: {msg}",
  "error.aggregation": "Aggregation error: {msg}",

  // Getting Started modal
  "gs.close": "Close",
  "gs.title": "Welcome to Aggy",
  "gs.section1.title": "Preparing Import Files",
  "gs.section1.p1":
    "This tool reads a <strong>raw data file</strong> (CSV) and a <strong>layout file</strong> (JSON) to perform aggregation.",
  "gs.section1.p2":
    "Please prepare and format the files yourself.<br>We provide a dedicated <strong>Agent Skill</strong> so you can delegate the conversion to your AI tool.",
  "gs.section1.sample": "Try it out with <strong>sample files</strong> first:",
  "gs.section1.sampleCsv": "Sample Raw Data",
  "gs.section1.sampleLayout": "Sample Layout",
  "gs.section2.title": "Security",
  "gs.section2.p1":
    "Aggy runs <strong>entirely serverless</strong>. All processing happens in your browser, and uploaded data is never sent to any external server.",
  "gs.section3.title": "Basic Usage",
  "gs.section3.step1": "Load a raw data file and a layout file",
  "gs.section3.step2": "Select cross-tabulation axes if needed",
  "gs.section3.step3": 'Click the "Run Aggregation" button',
  "gs.dismiss": "Don't show again",
  "gs.ok": "Get Started",

  // Help button
  "help.label": "User Guide",

  // Settings modal
  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.theme": "Theme",
  "settings.theme.light": "Light",
  "settings.theme.dark": "Dark",
  "settings.theme.system": "Follow system",
  "settings.ai": "AI Analysis Comment",
  "settings.ai.on": "ON",
  "settings.ai.off": "OFF",
  "settings.close": "Close",
};

export default en;
