const en: Record<string, string> = {
  // Header
  "header.subtitle": "SURVEY AGGREGATOR β",
  "header.settings": "Open settings",
  "header.back": "Back to data import",

  // DuckDB status
  "wasm.idle": "DuckDB idle",
  "wasm.loading": "Loading DuckDB...",
  "wasm.ready": "DuckDB ready",
  "wasm.error": "DuckDB error: {msg}",

  // Import screen
  "import.title": "Load Data",
  "import.history": "History",
  "import.step.select": "Select Files",
  "import.step.proceed": "Aggregate",
  "import.proceed": "Proceed to Aggregation →",
  "import.start": "Start Aggregation",

  // Validation step
  "validation.title": "Data Validation",
  "validation.running": "Validating...",
  "validation.check.layoutStructure": "Layout JSON structure is valid",
  "validation.check.saCode": "SA column codes match layout definition",
  "validation.check.columns": "Layout-defined columns exist in CSV",
  "validation.check.maValues": "MA columns contain only 0/1",
  "validation.check.numeric": "Numeric columns contain only numbers",
  "validation.ok": "OK",
  "validation.error": "Error",
  "validation.warn": "Warning",
  "validation.detail.invalidLayout": "{key}: {reason}",
  "validation.detail.dropped": "{key} ({label}, {type}) not found in CSV",
  "validation.detail.unknownCode": "{key} ({label}) has undefined codes: {codes}",
  "validation.detail.invalidMAValue": "{key} ({label}) MA columns have non-0/1 values: {values}",
  "validation.detail.nonNumeric": "{key} ({label}) has {count} non-numeric value(s)",
  "validation.fixPrompt": "Please fix the files and re-upload",
  "validation.back": "Back to file selection",

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
  "section.toc": "Index",
  "section.cross": "Cross-Tabulation Axes",
  "section.cross.label": "Cross-tabulation axis selection",
  "summary.rows": "{rows} rows {cols} cols",
  "weight.label": "Weight-back ({col})",
  "weight.on": "ON",
  "weight.off": "OFF",

  // Data config bar (cross + weight)
  "cross.summary": "{names} +{rest}",
  "cross.popover.empty": "No questions available",

  // Results
  "result.title.tab": "Aggregation Results",
  "result.meta.count": "{count} questions",
  "result.meta.cross": "Cross: {names}",
  "result.weight.applied": "Weighted",
  "result.weight.none": "Unweighted",
  "agg.settings": "Aggregation",
  "agg.settings.label": "Open aggregation settings",
  "result.view.table": "Table",
  "result.view.chart": "Chart",
  "result.pct.column": "Col %",
  "result.pct.row": "Row %",
  "result.csv.export": "Export All CSV",

  // Export menu
  "export.label": "Export",
  "export.section.copy": "Copy",
  "export.section.download": "Download",
  "export.copied": "Copied ✓",
  "export.header.variable": "Variable",
  "export.header.type": "Type",
  "export.header.option": "Option",
  "export.header.n": "n",
  "export.header.pct": "%",
  "export.header.total.n": "Total_n",
  "export.header.total.pct": "Total_%",
  "export.long.total": "(Total)",
  "export.long.crossAxis": "Cross Axis",
  "export.long.crossValue": "Cross Value",
  "export.long.count": "Count",
  "label.noAnswer": "No answer",

  // NA (Numerical Answer)
  "na.stat.n": "n",
  "na.stat.mean": "Mean",
  "na.stat.median": "Median",
  "na.stat.sd": "Std Dev",
  "na.stat.min": "Min",
  "na.stat.max": "Max",
  "na.binWidth": "Class width",

  // Display settings dropdown
  "display.settings": "Display",
  "display.disabled.tooltip": "Select a cross-tabulation axis to enable",
  "display.viewMode": "View Mode",
  "display.tableSettings": "Table Settings",
  "display.chartSettings": "Chart Settings",
  "display.pctBasis": "% Basis",
  "display.saType": "SA Chart Type",
  "display.maType": "MA Chart Type",

  // Chart type
  "chart.barH": "Horizontal Bar",
  "chart.barV": "Vertical Bar",
  "chart.obi": "Stacked",
  "chart.palette": "Color",

  // Table headers
  "table.option": "Option",
  "table.graph": "Graph",
  "table.total": "Total",
  "table.caption.tab": "Aggregation results for {question}",
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

  // Warnings
  "warn.date.cast": "{col}: {count} date values could not be converted",

  // Errors
  "error.csv.load": "Error loading raw data file: {msg}",
  "error.layout.load": "Error loading layout file: {msg}",
  "error.saved.load": "Error loading history data: {msg}",
  "error.aggregation": "Aggregation error: {msg}",
  "error.date.prepare": "Date column preparation error: {msg}",

  // Getting Started modal
  "gs.close": "Close",
  "gs.title": "Welcome to Aggy",
  "gs.section1.title": "Preparing Import Files",
  "gs.section1.p1":
    "This tool reads a <strong>raw data file</strong> (CSV) and a <strong>layout file</strong> (JSON) to perform aggregation.",
  "gs.section1.p2":
    "Please prepare and format the files yourself.<br>A dedicated <strong>Agent Skill</strong> is coming soon — once available, you can delegate the conversion to your AI tool.",
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
  "help.label": "Open user guide",
  "help.button": "Guide",

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

  // Changelog
  "changelog.title": "What's New",

  // Derived recipes
  "section.derived": "Derived Questions",
  "derived.empty": "No derived questions yet",
  "derived.add": "Add",
  "derived.edit": "Edit",
  "derived.delete": "Delete",
  "derived.kind.combineSA": "Combine SA",
  "derived.kind.binNA": "Bin NA",
  "derived.dialog.title": "Add Derived Question",
  "derived.dialog.combineSA.desc":
    "Combine multiple SA questions into a new SA axis (Cartesian product)",
  "derived.dialog.binNA.desc": "Bin a numeric question into ranges to form an SA axis",
  "derived.cancel": "Cancel",
  "derived.save": "Save",
  "derived.saving": "Saving...",
  "derived.field.code": "Code",
  "derived.field.label": "Name",
  "derived.binNA.label.suffix": " (binning)",
  "derived.combineSA.sources": "Source questions (SA, 2+)",
  "derived.combineSA.separator": "Separator",
  "derived.combineSA.preview.count": "Generated items: {count}",
  "derived.combineSA.preview.sample": "Sample",
  "derived.binNA.source": "Source question (NA)",
  "derived.binNA.bins": "Bin definitions",
  "derived.binNA.bin.code": "Code",
  "derived.binNA.bin.label": "Label",
  "derived.binNA.bin.min": "min",
  "derived.binNA.bin.max": "max",
  "derived.binNA.bin.minHint": "blank = -∞",
  "derived.binNA.bin.maxHint": "blank = +∞",
  "derived.binNA.bin.add": "Add row",
  "derived.binNA.preset.label": "Presets",
  "derived.binNA.preset.fill10": "Fill by 10",
  "derived.binNA.preset.fill5": "Fill by 5",
  "derived.binNA.preset.quartile": "Fill by quartile",
  "derived.binNA.preset.confirm": "Overwrite the current bin definitions?",
  "derived.binNA.coverage.uncoveredOf": "{count} / {total} rows uncovered",
  "derived.binNA.coverage.range": "Value range: {min} to {max}",
  "derived.binNA.coverage.uncovered": "{count} rows uncovered",
  "derived.binNA.coverage.full": "All {total} rows covered",
  "derived.error.required": "Required fields are missing",
  "derived.error.title": "Save failed",
  "derived.popover.add": "+ Add derived question",
  "derived.delete.confirm": 'Delete derived question "{code}"?',
};

export default en;
