# agg 集計関数の引数を Question から Shape に分離する

- **Date**: 2026-03-26
- **Status**: Accepted

## Context

集計関数（`aggTab`, `aggCrossTab`, `aggNaTab`, `aggNaCrossTab`）は DuckDB の SQL を組み立てて集計を実行する純粋なデータ処理層である。当初これらの関数には `Question` オブジェクトをそのまま渡していた。

`Question` インターフェースには SQL 集計に必要な情報（`type`, `columns`, `codes`）と、UI 表示にのみ必要な情報（`label`, `labels`, `code`）が混在している。SQL 集計の実行に `label` や `labels` は一切不要であり、集計層が表示用の情報に依存しているのは設計上不適切と判断した。

## Decision

**`Question` の部分型 `Shape = Pick<Question, "type" | "columns" | "codes">` を定義し、agg 関数の引数を `Shape` に限定する。**

具体的な設計:
- `Shape` — SQL 集計に必要な最小限のフィールド（型・カラム名・選択肢コード）のみを持つ
- `Axis = Pick<Question, "code" | "label" | "labels">` — 集計後の表示組み立てに必要なフィールドを持つ
- `buildTabs` が `Question` を受け取り、集計には `Shape` を、表示組み立て（`assembleTab`）には `Axis` を渡す分解の責務を担う
- NA 型の `aggNaTab` / `aggNaCrossTab` はさらにシンプルで、カラム名の `string` のみを受け取る

## Consequences

**良い影響:**
- 関心の分離が型レベルで強制される。
- agg 関数のテストで `Question` 全体を組み立てる必要がなくなり、テストの記述がシンプルになった
- agg 関数の引数から「SQL 集計に何が必要か」が一目でわかり、コードの意図が明確になった
- `Question` に表示用フィールドが増えても agg 関数に影響しないため、変更の波及範囲が限定される

**悪い影響:**
- 特になし。`Pick` による部分型の定義はコストが低く、実質的なデメリットは生じていない
