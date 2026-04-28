# 「集計開始」クリック → AggregationScreen 表示までの パフォーマンス計測

## 概要

`docs/frontend-performance-measurement.md` は「集計実行後の描画」を対象にしていたのに対し、本計測は **ImportScreen の「集計開始」ボタン押下 → AggregationScreen が初期表示されるまで** の遷移区間に焦点を当てる。

## 計測環境

- 日付: 2026-04-18
- 環境: https://develop.aggy.pages.dev/
- ブラウザ: Chrome（CPU/Network throttling なし）
- 計測: Chrome DevTools Performance trace + `performance.now()` によるフェーズマーカー
- データ: `bench/data/both.csv` + `both_layout.json`
  - 10,000 行 × 602 列
  - SA 100問 + MA 100問 + WEIGHT 1 問（合計 201 questions）
- 履歴（OPFS 保存済み）から再ロード → 「集計開始」クリック

## 計測結果

### ウォールクロック（クリックを 0ms とする）

| マイルストーン                                          | 到達時間 |
| ------------------------------------------------------- | -------- |
| ボタンクリック                                          | 0 ms     |
| `main` の `grid-template-columns` 変化（画面切替）      | 744 ms   |
| `Run Aggregation` ボタン可視化（SettingsPanel描画完了） | 866 ms   |
| 最初の `<table>` が DOM に出現（1 件目の結果）          | 1,187 ms |

### メインスレッド / Worker スレッドの内訳（最初の 1 秒間）

| スレッド                  | 活動時間合計 | 主な内容                                                     |
| ------------------------- | ------------ | ------------------------------------------------------------ |
| Renderer Main             | 357 ms       | 主に Worker からの postMessage 受信処理（細切れ 0.1〜0.3ms） |
| DedicatedWorker（DuckDB） | 1,319 ms     | Wasm 上の SQL 実行                                           |

メインスレッドの Long Task は click 後 2 つしかない:

| Long Task 発生時刻 | duration | 内容（推定）                                                            |
| ------------------ | -------- | ----------------------------------------------------------------------- |
| t = 851 ms         | 96 ms    | `handleProceed` 後半 + App の画面切替 + AggregationScreen の動的 import |
| t = 947 ms         | 142 ms   | AggregationScreen マウント / SettingsPanel + ResultPanel の初期 render  |

つまり、**0 〜 ~850 ms の大半は Worker が DuckDB クエリを直列に処理している時間** で、メインスレッドはアイドル寄り（UI もフリーズしない）。

### Worker スレッドのイベント

- `HandlePostMessage`: 523 件（= Worker が受信したメッセージ数）
- `SchedulePostMessage`: 1,481 件（= Worker が送信したメッセージ数）

1 秒間に ~523 件のメッセージを捌いており、それらは `src/lib/validateRawData.ts` が発行する **逐次の DuckDB クエリ** に対応する。

## ボトルネック分析

### 根本原因: `validateRawData()` が大量の逐次クエリを発行

`src/lib/validateRawData.ts:22-43` の `for` ループで layout のひとつひとつの question に対して DuckDB に問い合わせる:

| Question type | クエリ数 / 問                      | 本 layout での合計 |
| ------------- | ---------------------------------- | ------------------ |
| SA            | 1（DISTINCT）                      | 100 問 → 100       |
| MA            | 2（値チェック + 全 NULL チェック） | 100 問 → 200       |
| WEIGHT        | 1（TRY_CAST ができない数を COUNT） | 1 問 → 1           |
| **合計**      |                                    | **301 クエリ**     |

これらが `await` で直列実行されるため、Worker 上で 1 クエリあたり ~3ms と高速でも **合計 ~830 ms** を消費する。DuckDB Wasm は 1 コネクション 1 クエリの制約があり、メインスレッドは postMessage を受けるだけなので Long Task は発生しないが、クリック → 画面切替の壁時計時間をまるごと食っている。

### 各フェーズの内訳（`both` 10,000×602）

| フェーズ                                                  | 時間        | 占める割合 |
| --------------------------------------------------------- | ----------- | ---------- |
| `handleStart` → `runValidation`（301 クエリ）             | ~830 ms     | 約 87%     |
| `handleProceed` の残り + App の画面切替 + 動的 import     | ~95 ms      | 約 10%     |
| AggregationScreen 初期 render（SettingsPanel 含む）       | ~40 ms      | 約 4%      |
| **クリック → AggregationScreen が表示されるまで（合計）** | **~950 ms** | **100%**   |

その後、AggregationScreen の `onMount` が `handleRunAggregation()` をキックし、最初の結果テーブルが画面に描画されるのは click から **~1,187 ms**。

## 改善方針

優先度は 「実装コスト × 期待効果」 で評価。

| 優先度 | 施策                                                                     | 期待効果                       | 実装コスト |
| ------ | ------------------------------------------------------------------------ | ------------------------------ | ---------- |
| P0     | **validation を AggregationScreen に移す（非同期化）**                   | クリック → 画面 ~95 ms         | 中         |
| P0     | **MA の 2 クエリを 1 本化**（UNION ALL / 同じ COUNT 系）                 | 200 クエリ → 100 クエリ        | 小         |
| P1     | **SA DISTINCT を UNION ALL で 1 クエリに束ねる**                         | 100 クエリ → 1 クエリ          | 中         |
| P1     | **WEIGHT / NA の TRY_CAST チェックをまとめる**                           | わずかだが効く                 | 小         |
| P2     | **ファイルアップロード直後からバックグラウンド validation を開始**       | クリック時にはほぼ完了している | 中         |
| P2     | **`loadedFromSaved === true` の場合 validation をスキップ / キャッシュ** | 履歴再ロード時 ~830 ms→0 ms    | 小         |

### P0-1: validation を画面遷移後に動かす

最もユーザー体感に効く。現状 `ImportScreen.handleStart` は

```ts
const diags = await runValidation(...);  // ~830ms ブロック
if (diags.length === 0) await handleProceed();
else { /* step=2 でエラー表示 */ }
```

となっているが、validation の結果の大半（`both` では 0 件）はエラーなしで、そのまま `handleProceed` に抜けている。

**案**: `onComplete` で AggregationScreen 側に `pendingValidation: Promise<Diagnostic[]>` を渡し、AggregationScreen 側で await する。エラーが出たら AggregationScreen 上に戻るダイアログを出すか、`ImportScreen` に戻す。

ただし「エラーありだったら別画面でエラーを出したい」という既存 UX を維持するなら次の亜種:

- `runValidation` を Promise のまま `onComplete` に渡す
- `App.svelte` は画面を切り替えつつ、Promise を解決してエラーがあれば `ImportScreen` へ戻す
- エラー率が低いことを前提に「先行レンダリング + 後追い検証」という楽観的 UI にする

期待効果: クリック → AggregationScreen 表示 **~950 ms → ~100 ms**（動的 import と Svelte マウントだけが残る）。

### P0-2: MA の 2 クエリ統合

`checkMAValues` と `checkMAAllNull` は同じ列群を走査している。1 本の CTE / 集約クエリにまとめれば **MA 100 問 × 2 → 100 問 × 1** にできる。

```sql
SELECT
  '{col}' AS col,
  COUNT(*) FILTER (WHERE v NOT IN ('0','1') AND v IS NOT NULL) AS invalid_cnt,
  COUNT(*) FILTER (WHERE v IS NOT NULL) AS non_null_cnt
FROM (SELECT CAST("{col}" AS VARCHAR) AS v FROM survey)
```

を MA 列分 UNION ALL で 1 本化すれば **200 クエリ → 1 クエリ**。

### P1: SA DISTINCT の束ね

`checkSAUnknownCodes` は各 SA 列で `SELECT DISTINCT ... FROM survey` を発行している。これも UNION ALL で 1 本化可能。

`docs/performance-investigation.md` で「aggregate 本体で UNION ALL しても効果薄」との結論があったが、あちらは **クエリの中身が重い**（各集計で大半の行をスキャン）ケース。validation の `SELECT DISTINCT` / `COUNT` 系は per-query overhead のほうが支配的なので、束ねる価値は十分ある。

### P2: loadedFromSaved のスキップ

OPFS 履歴から読み込んだ場合、layout と raw data は以前 validation を通過したもの。再実行するメリットは薄い。`loadedFromSaved === true` のときに validation をスキップ（または「警告のみ欠損チェック」にだけ縮小）しても安全。

本計測は履歴経由のロードだったため、この最適化だけで **~830 ms ほぼゼロ** になる。

## 参考

- 計測トレース（Chrome DevTools で読み込み可能）: `/tmp/aggy-perf-transition2.json.gz`
- 計測スクリプト: `performance.now()` を `click` 前後で記録し、`MutationObserver` で `main` の grid-template-columns 変化 / `Run Aggregation` ボタン出現 / `<table>` 出現を捕捉
- 関連コード:
  - `src/components/ImportScreen.svelte:128-176`（`handleStart` / `handleProceed`）
  - `src/lib/validateRawData.ts:14-44`（`validateRawData`）
  - `src/App.svelte:22-30, 48-57`（画面切替 + `AggregationScreen` の動的 import）
