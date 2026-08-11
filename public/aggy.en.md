# Aggy

[日本語](https://aggy.pages.dev/aggy.md)

> Turn raw data into answers—fast

Aggy is a browser-based tool for aggregating raw survey data. Load a CSV of responses and a layout JSON that defines your questions, then generate grand totals, cross-tabs, weighted results, and charts.

- App: https://aggy.pages.dev/app/?lang=en
- Source code: https://github.com/Yuki-bach/aggy
- Price: Free
- Account required: No
- Installation required: No

## Why Aggy

### Your response data is never sent to an external server

The CSV and layout JSON you load are not sent to Aggy's servers for aggregation. DuckDB Wasm loads, validates, and aggregates the data entirely in your browser. If you choose to save files locally in the browser, Aggy uses OPFS.

### Results appear fast

Aggy runs DuckDB, an analytical database, as WebAssembly in your browser and aggregates data with SQL. You can switch cross-tab axes and views without waiting for data to travel to and from a server.

### Built for survey aggregation

Aggy supports SA (single-answer), MA (multiple-answer), NA (numeric-answer), DATE, and MATRIX questions. It works independently of your survey collection service as long as you provide a matching CSV and layout JSON.

## Features

- Grand totals for all questions
- Cross-tabulation with multiple axes
- Weighted aggregation
- Combining and recoding single-answer questions
- Binning numeric-answer questions
- Tables, horizontal and vertical bars, stacked bars, and histograms
- Copying or downloading results as CSV, TSV, Markdown, or JSON
- Pre-aggregation validation of the layout structure, columns, response codes, and values
- Japanese and English interfaces

## How to use Aggy

1. Prepare a CSV of survey responses and a layout JSON that defines the questions.
2. Open Aggy in your browser and load both files.
3. Select cross-tab axes as needed and review the results.
4. Copy or download the results in your preferred format.

You can download a sample CSV and sample layout JSON from the app.

## Good use cases

- Generating grand totals and cross-tabs from collected survey CSVs
- Aggregating sensitive response data locally
- Repeating aggregation for tracking studies that share question definitions
- Reducing manual aggregation work in spreadsheets

## Not currently supported

- Survey creation, distribution, or response collection
- Full-scale coding of open-ended responses
- Advanced statistical tests or multivariate analysis
- Collaborative editing
- Automated PowerPoint report generation

## Frequently asked questions

### What happens to the data I load?

Your response data is never sent to Aggy's servers. DuckDB Wasm loads, validates, and aggregates it entirely in your browser.

### Is Aggy free to use?

Aggy is currently free and does not require an account.

### What is a layout JSON?

A layout JSON defines which question each CSV column belongs to, the question type—such as SA, MA, or NA—and the labels displayed for response codes.

### Can I use a CSV from Google Forms or another survey tool?

Yes. You can use it as long as you provide a matching layout JSON. The CSV column names must match the layout definition.

### Why does Aggy display results quickly?

Aggy runs DuckDB as WebAssembly in your browser and aggregates data with SQL, so your response data does not need to travel to and from an aggregation server.

---

Last updated: August 11, 2026
