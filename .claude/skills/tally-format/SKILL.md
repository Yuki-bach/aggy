---
name: tally-format
description: Tallyアンケート集計ツール用CSVローデータとJSONレイアウトファイルのフォーマット仕様・バリデーション。フォーマット変換、データ検証、ファイル準備に関する質問で自動発動。
disable-model-invocation: true
---

# Tally フォーマット仕様・バリデーション

Tallyは2つのファイルを必要とする：**CSVローデータ**と**JSONレイアウトファイル**。このスキルはこれらの形式の仕様を説明し、バリデーションを支援する。

---

## 1. CSVローデータ仕様

### 基本要件

- **エンコーディング**: UTF-8（BOM付きも可）
- **区切り文字**: カンマ (`,`)
- **1行目**: ヘッダー行（カラム名）必須
- **2行目以降**: データ行
- **全カラムは文字列として読み込まれる**（DuckDBが `all_varchar=true` で処理）

### カラム種別

| 種別 | 説明 | CSV上の表現 | 例 |
|------|------|------------|-----|
| **ID** | 回答者識別子 | 任意の文字列 | `1`, `R001` |
| **WEIGHT** | ウェイト値 | 数値文字列（小数可） | `1.0`, `0.85` |
| **SA** | 単一回答 | 1列に1つのコード値 | `1`, `2`, `3` |
| **MA** | 複数回答 | 列名 `{key}_{code}` で 1/0 フラグ | `1`, `0`, `true`, `false` |
| **EXCLUDE** | 除外フラグ | 値ありの行を除外 | `1`, `exclude` |

### MA（複数回答）列の命名規則

MAは1つの設問に対して**複数のCSV列**を使用する。命名パターン：

```
{設問key}_{選択肢code}
```

例：設問 `q3` に選択肢 1, 2, 3 がある場合 → `q3_1`, `q3_2`, `q3_3`

**MA列の有効な値:**
- `1` または `true` → 選択あり
- `0`, `false`, 空文字, NULL → 選択なし
- **それ以外の値は無効**

### CSVサンプル

```csv
id,weight,q1,q2,q3_1,q3_2,q3_3
1,1.2,1,3,1,0,1
2,0.9,2,1,0,1,1
3,1.5,1,2,1,1,0
4,0.8,3,1,1,0,0
5,1.1,1,3,0,1,1
6,1.0,2,2,1,0,1
7,1.3,1,1,0,1,0
8,0.7,3,3,1,0,1
9,1.4,2,2,1,1,0
10,1.0,1,1,0,0,1
```

---

## 2. JSONレイアウトファイル仕様

### TypeScript型定義

```typescript
interface LayoutItem {
  code: string;    // 選択肢コード（CSVの値またはMA列名のサフィックス）
  label: string;   // 選択肢の表示ラベル
  column?: string; // MA列名の明示指定（省略時は {key}_{code} で導出）
}

type LayoutColType = "SA" | "MA" | "ID" | "WEIGHT" | "EXCLUDE";

interface LayoutEntry {
  key: string;           // CSVのカラム名（SA/ID/WEIGHT/EXCLUDE）またはMAグループのプレフィックス
  label?: string;        // 設問の表示名
  type: LayoutColType;   // カラム種別
  items?: LayoutItem[];  // SA/MAの場合必須：選択肢一覧
}

// ルート: LayoutEntry の配列
type Layout = LayoutEntry[];
```

### フィールド詳細

#### LayoutEntry

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `key` | 必須 | SA/ID/WEIGHT/EXCLUDE: CSV列名と一致。MA: 列名プレフィックス |
| `label` | 任意 | 設問の表示ラベル（省略時はkeyが使用される） |
| `type` | 必須 | `"SA"`, `"MA"`, `"ID"`, `"WEIGHT"`, `"EXCLUDE"` のいずれか |
| `items` | SA/MAで必須 | 選択肢の配列 |

#### LayoutItem

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `code` | 必須 | SA: CSVセルの値。MA: `{key}_{code}` のcode部分 |
| `label` | 必須 | 選択肢の表示ラベル |
| `column` | 任意 | MA列名を明示指定（デフォルト: `{key}_{code}`） |

### レイアウトサンプル

```json
[
  {
    "key": "id",
    "type": "ID"
  },
  {
    "key": "weight",
    "type": "WEIGHT"
  },
  {
    "key": "q1",
    "label": "性別",
    "type": "SA",
    "items": [
      { "code": "1", "label": "男性" },
      { "code": "2", "label": "女性" },
      { "code": "3", "label": "その他" }
    ]
  },
  {
    "key": "q2",
    "label": "満足度",
    "type": "SA",
    "items": [
      { "code": "1", "label": "満足" },
      { "code": "2", "label": "どちらでもない" },
      { "code": "3", "label": "不満" }
    ]
  },
  {
    "key": "q3",
    "label": "利用しているサービス",
    "type": "MA",
    "items": [
      { "code": "1", "label": "サービスA" },
      { "code": "2", "label": "サービスB" },
      { "code": "3", "label": "サービスC" }
    ]
  }
]
```

---

## 3. バリデーション手順

ユーザーからCSVとJSONレイアウトファイルを受け取ったら、以下の手順で検証する。

### 自動検証スクリプトの実行

```bash
npx tsx scripts/validate-tally-files.ts <csv-path> <layout-json-path>
```

このスクリプトは以下の4段階の検証を自動実行する。

### Step 1: CSV構造の検証

- ファイルがCSVとしてパース可能か
- ヘッダー行が存在するか
- 空のカラム名がないか
- 重複したカラム名がないか
- 各行の列数がヘッダーと一致するか

### Step 2: レイアウトスキーマの検証

- 有効なJSON配列であるか
- 各エントリに `key`（文字列）と `type`（文字列）が存在するか
- `type` が有効値（SA/MA/ID/WEIGHT/EXCLUDE）か
- SA/MAエントリに `items` 配列が存在するか
- 各itemに `code` と `label` が存在するか
- `key` の重複がないか

### Step 3: CSV↔レイアウトの整合性検証

- SA/ID/WEIGHT/EXCLUDEの `key` がCSVヘッダーに存在するか
- MAの各itemの列（`{key}_{code}` or `item.column`）がCSVヘッダーに存在するか
- CSVにあるがレイアウトに未定義の列はないか（警告）

### Step 4: データ値の検証（先頭100行サンプリング）

- WEIGHT列の値が数値に変換可能か
- SA列の値がitemsのcodeに含まれるか
- MA列の値が `1`/`0`/`true`/`false`/空 のいずれかか
- ID列に空値がないか

---

## 4. よくある問題と対処法

### MA列名の大文字小文字不一致

CSVヘッダーが `Q3_1` でレイアウトの key が `q3` の場合、`q3_1` を期待するため不一致になる。
→ CSVヘッダーまたはレイアウトのkeyの大文字小文字を統一する。`item.column` で明示指定も可能。

### WEIGHT列に数値でない値がある

`TRY_CAST` でDOUBLEに変換されるため、数値でない値はNULL（実質0ウェイト）として扱われる。
→ 数値文字列に変換するか、該当行を確認する。

### SA列にitemsに定義されていないコードがある

未定義コードは集計結果の「その他」等に含まれない。
→ レイアウトのitemsに不足しているコードを追加するか、CSVデータを確認する。

### CSVにBOMが含まれている

UTF-8 BOM（`\uFEFF`）はバリデーションスクリプトで自動除去される。Tally本体もDuckDBが処理するため問題ない。

### MA列の値が 1/0 以外（例: 2, 3 など度数値）

Tallyは `1`/`true` のみを「選択あり」として扱う。度数値が入っている場合は、0 以外を全て `1` に変換する必要がある。

---

## 5. 参考ファイル

- テストCSV: `testdata/test_data.csv`
- テストレイアウト: `testdata/test_layout.json`
- レイアウト型定義: `src/lib/layout.ts`
- CSV読み込み処理: `src/lib/duckdbBridge.ts`
- 集計SQL生成: `src/lib/aggregator.ts`
