# Cell構造リファクタリング 実装計画

## 概要

Cell型を `{ main, sub }` 形式から `{ key: Record<string, string> }` 形式に変更し、
main/subの非対称性を解消する。併せて以下を実施:

- AggResult.type を削除（LayoutMetaから導出可能に）
- MAQuestion.codes を追加（選択肢コードを集計層で利用可能に）
- valueLabelsをSA/MA統一形式に変更
- crossSub/parseCrossSub/CROSS_SEP を廃止
- resolveSubLabel を廃止し resolveValueLabel に統合
- pivot() を新API（cell()アクセサ + crossAxes構造）に変更

影響ファイル: 約20ファイル

---

## Phase 1: 型定義とレイアウト基盤

### Step 1 — Cell / AggResult / MAQuestion 型定義の変更
**File: `src/lib/agg/aggregate.ts`**

```typescript
// Before
interface Cell { main: string; sub: string; n: number; count: number; pct: number; }
interface AggResult { question: string; type: "SA" | "MA"; cells: Cell[]; }
interface MAQuestion { type: "MA"; prefix: string; columns: string[]; }

// After
interface Cell { key: Record<string, string>; n: number; count: number; pct: number; }
interface AggResult { question: string; cells: Cell[]; }
interface MAQuestion { type: "MA"; prefix: string; columns: string[]; codes: string[]; }
```

- `CROSS_SEP`, `crossSub()`, `parseCrossSub()` を削除
- `isGT(cell: Cell): boolean` ヘルパーを追加 (`Object.keys(cell.key).length === 1`)

### Step 2 — mkCell 更新
**File: `src/lib/agg/sqlHelpers.ts`**

```typescript
// Before
mkCell(main: string, sub: string, n: number, count: number): Cell

// After
mkCell(key: Record<string, string>, n: number, count: number): Cell
```

### Step 3 — LayoutMeta 更新
**File: `src/lib/layout.ts`**

LayoutMetaに`questionTypes`フィールドを追加:
```typescript
interface LayoutMeta {
  questionLabels: Record<string, string>;
  valueLabels: Record<string, Record<string, string>>;  // 形式変更
  colTypes: Record<string, string>;                     // 既存のまま（buildQuestionDefsが使用）
  questionTypes: Record<string, "SA" | "MA">;           // 新規追加
}
```

`buildLayoutMeta()` 変更:
- SA: 変更なし (`valueLabels["q1"]["1"] = "男性"`)
- MA: `valueLabels["q3"]["1"] = "サービスA"` に変更（現状 `valueLabels["q3_1"]["1"]`）
- 全設問で `questionTypes[key] = "SA" | "MA"` を設定

`buildQuestionDefs()` 変更:
- MA: `codes` を `colTypes` から導出
  - `colTypes["q3_1"] = "ma:q3"` → prefix="q3", code = col名からprefix+"_"を除去 → "1"
  - columns と codes を並行配列として構築

---

## Phase 2: 集計層

### Step 4 — GtAggregator 更新
**File: `src/lib/agg/gtAggregator.ts`**

- コンストラクタに `mainQ: string` を追加（SA: column名, MA: prefix）
- SA: `mkCell({ [mainQ]: String(r.mv) }, n, count)`
- MA: `mkCell({ [mainQ]: codes[i] }, n, count)` ← `codes` 使用
- NA: `mkCell({ [mainQ]: NA_VALUE }, n, count)`

### Step 5 — CrossAggregator 更新
**File: `src/lib/agg/crossAggregator.ts`**

- コンストラクタに `mainQ: string` を追加
- SA main: `mkCell({ [mainQ]: mv, [crossKey]: crossVal }, n, count)`
- MA main: `mkCell({ [mainQ]: codes[i], [crossKey]: crossVal }, n, count)`
- crossKey/crossVal:
  - SA cross: crossKey = crossQ.column, crossVal = String(sv)
  - MA cross: crossKey = crossQ.prefix, crossVal = crossQ.codes[j]
- fetchCrossHeaders: MA cross のヘッダーラベルも codes ベースに

### Step 6 — aggregate() エントリポイント更新
**File: `src/lib/agg/aggregate.ts`**

- AggResult から `type` を削除
- GtAggregator/CrossAggregator に `mainQ` を渡す
- MA の場合、`q.codes` を aggregator に渡す

---

## Phase 3: Pivot

### Step 7 — pivot() リライト
**File: `src/lib/agg/pivot.ts`**

```typescript
interface CrossAxisInfo {
  question: string;
  values: { value: string; n: number }[];
}

interface PivotResult {
  mainQ: string;
  mains: string[];
  crossAxes: CrossAxisInfo[];
  cell(mainVal: string, cross?: { question: string; value: string }): Cell | undefined;
}

function pivot(cells: Cell[], mainQ: string): PivotResult
```

- `mains`: `cells.map(c => c.key[mainQ])` のユニーク値
- `crossAxes`: mainQ以外のキーをグループ化し、各値のnを収集
- `cell()`: 内部Map（シリアライズ済みキー）で検索。消費側はエンコードを意識しない
- GT: `pv.cell("1")` — crossなし
- Cross: `pv.cell("1", { question: "q2", value: "2" })`

---

## Phase 4: ラベル解決

### Step 8 — labels.ts 簡素化
**File: `src/lib/labels.ts`**

```typescript
// Before: type分岐 + parseCrossSub
resolveValueLabel(type: "SA" | "MA", col: string, rowLabel: string, meta?: LayoutMeta): string
resolveSubLabel(subLabel: string, meta?: LayoutMeta, crossCols?: QuestionDef[]): string

// After: 統一された単一関数
resolveValueLabel(question: string, code: string, meta?: LayoutMeta): string
// → meta?.valueLabels[question]?.[code] ?? code
```

- `resolveSubLabel` を削除（`resolveValueLabel` で統一）
- `resolveQuestionLabel` は変更なし
- `parseCrossSub` インポートを削除

---

## Phase 5: UIコンポーネント

### Step 9 — AggregationContext
**File: `src/components/aggregation/AggregationContext.ts`**

- `AggResult` 型の変更を反映（type削除）
- 型変更のみ、ロジック変更なし

### Step 10 — ResultCard
**File: `src/components/aggregation/ResultCard.tsx`**

- `c.sub === "GT"` → `isGT(c)` に変更
- `res.type` 表示 → `layoutMeta.questionTypes[res.question]` から取得

### Step 11 — GtTable
**File: `src/components/aggregation/GtTable.tsx`**

- `pivot(res.cells)` → `pivot(res.cells, res.question)` に変更
- `lookup.get(\`${main}\0GT\`)` → `pv.cell(main)` に変更
- `resolveValueLabel(res.type, res.question, main, layoutMeta)` → `resolveValueLabel(res.question, main, layoutMeta)` に変更
- `res.type === "SA"` 判定 → `layoutMeta.questionTypes[res.question] === "SA"` に変更

### Step 12 — CrossTable
**File: `src/components/aggregation/CrossTable.tsx`**

- `groupSubsByCrossAxis()` を削除 → `pv.crossAxes` を直接使用
- `lookup.get(\`${main}\0GT\`)` → `pv.cell(main)` に変更
- `lookup.get(\`${main}\0${sub.label}\`)` → `pv.cell(main, { question, value })` に変更
- `resolveSubLabel(sub.label, ...)` → `resolveValueLabel(axis.question, v.value, ...)` に変更
- `parseCrossSub` インポート削除
- `useCrossTableData` の返り値型を更新（SubInfo → CrossAxisInfo ベースに）

### Step 13 — TableContent
**File: `src/components/aggregation/TableContent.tsx`**

- `r.cells.filter(c => c.sub === "GT")` → `r.cells.filter(isGT)` に変更
- `pivot(res.cells)` → `pivot(res.cells, res.question)` に変更
- `pv.subs.length > 1` → `pv.crossAxes.length > 0` に変更

### Step 14 — ChartContent
**File: `src/components/aggregation/ChartContent.tsx`**

- `res.type === "SA"` → `layoutMeta.questionTypes[res.question] === "SA"` に変更
- `pivot(res.cells)` → `pivot(res.cells, res.question)` に変更
- `resolveValueLabel(res.type, res.question, m, layoutMeta)` → `resolveValueLabel(res.question, m, layoutMeta)` に変更
- `resolveSubLabel(s.label, layoutMeta, crossCols)` → `resolveValueLabel(axis.question, v.value, layoutMeta)` に変更
- `lookup.get(\`${m}\0GT\`)` → `pv.cell(m)` に変更
- `lookup.get(\`${m}\0${sub.label}\`)` → `pv.cell(m, { question, value })` に変更
- `pv.subs.length > 1` → `pv.crossAxes.length > 0` に変更

---

## Phase 6: エクスポート

### Step 15 — exportGrid.ts
**File: `src/lib/export/exportGrid.ts`**

- `resolveSubLabel` (ローカル定義) を削除 → labels.ts の `resolveValueLabel` を使用
- `resolveMainLabel` を更新: N/A チェックのみ残す
- `pivot(res.cells)` → `pivot(res.cells, res.question)` に変更
- `lookup.get(...)` → `pv.cell(...)` に変更
- `res.type` → `layoutMeta.questionTypes[res.question]` (ExportGrid.type用)
- `pv.subs` → `pv.crossAxes` に変更
- `parseCrossSub` インポート削除
- `ExportGrid.type` は外部フォーマッタが使用するため残す（layoutMetaから導出して設定）
- `buildExportGrids` の `layoutMeta` パラメータを必須に変更

### Step 16 — formatters/json.ts
**File: `src/lib/export/formatters/json.ts`**

- `res.type` → `layoutMeta.questionTypes[res.question]` に変更
- `lookup.get(...)` → `pv.cell(...)` に変更
- `resolveSubLabel(sub.label, ...)` → `resolveValueLabel(axis.question, v.value, ...)` に変更
- `pv.subs` → `pv.crossAxes` に変更
- `layoutMeta` パラメータを必須に変更
- `JsonExportEntry.type` はエクスポート形式として残す（layoutMetaから導出）

### Step 17 — export.ts
**File: `src/lib/export/export.ts`**

- `pivot(r.cells).subs.length > 1` → `pivot(r.cells, r.question).crossAxes.length > 0` に変更

---

## Phase 7: AI / その他

### Step 18 — aiComment.ts
**File: `src/lib/aiComment.ts`**

- `c.sub === "GT"` → `isGT(c)` に変更
- `c.main` → Cell.key からmainQ の値を取得
- `resolveVLabel(type, col, code, meta)` → LayoutMeta統一形式で簡素化
- `res.type` → `layoutMeta.questionTypes[res.question]` に変更
- `layoutMeta` パラメータを必須に変更

---

## Phase 8: テスト

### Step 19 — aggregate.test.ts

`findCell` ヘルパーを更新:
```typescript
// Before
function findCell(cells: Cell[], main: string, sub: string): Cell | undefined {
  return cells.find(c => c.main === main && c.sub === sub);
}

// After
function findCell(cells: Cell[], key: Record<string, string>): Cell | undefined {
  return cells.find(c =>
    Object.keys(key).length === Object.keys(c.key).length &&
    Object.entries(key).every(([k, v]) => c.key[k] === v)
  );
}
```

全テストケースのアサーションを更新:
- `findCell(r.cells, "1", "GT")` → `findCell(r.cells, { q1: "1" })`
- `findCell(r.cells, "q3_1", "GT")` → `findCell(r.cells, { q3: "1" })` ← コード正規化
- `findCell(r.cells, "1", crossSub("q1", "1"))` → `findCell(r.cells, { q2: "1", q1: "1" })`
- `crossSub` インポートを削除
- `r.type` アサーション削除

### Step 20 — export.test.ts

- `AggResult` 型のインポート更新
- `grid.type` アサーション: LayoutMeta を渡すか、ExportGrid.type の導出を確認
- JSON formatter テスト: `type` フィールドの検証を更新

---

## Phase 9: 検証

### Step 21 — CI検証

```bash
pnpm check    # fmt:check + lint + tsc --noEmit
pnpm test     # vitest
```

全パスを確認。

---

## 変更サマリー

| 削除されるもの | 代替 |
|---|---|
| `Cell.main` / `Cell.sub` | `Cell.key: Record<string, string>` |
| `AggResult.type` | `LayoutMeta.questionTypes[question]` |
| `CROSS_SEP` / `crossSub()` / `parseCrossSub()` | 不要（Record keyで直接表現） |
| `resolveSubLabel()` (2箇所) | `resolveValueLabel()` に統合 |
| `groupSubsByCrossAxis()` | `PivotResult.crossAxes` |
| `pivot().lookup` (生Map) | `pivot().cell()` アクセサ |

| 追加されるもの | 目的 |
|---|---|
| `MAQuestion.codes` | MA選択肢コードを集計層で利用 |
| `LayoutMeta.questionTypes` | AggResult.type の代替 |
| `isGT(cell)` | GT判定ヘルパー |
| `PivotResult.crossAxes` | クロス軸の構造化情報 |
| `PivotResult.cell()` | エンコードを隠蔽したアクセサ |
