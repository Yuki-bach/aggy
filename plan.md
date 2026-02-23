# Temotto — アンケートローデータ集計システム 実装プラン

## 概要

**Temotto** は、アンケートのローデータCSVをブラウザに読み込むだけで、GT集計・クロス集計・ウェイトバック集計を行えるWebアプリ。サーバー不要、レイアウトファイル不要。集計エンジンはRuby Wasmで実装する。

---

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| UI | Vanilla TypeScript + Vite |
| スタイル | CSS Modules（フレームワークなし） |
| CSVパース | Papa Parse |
| 集計エンジン | Ruby Wasm（`@ruby/wasm-wasi`） |
| JS↔Ruby通信 | JSON文字列のやり取り |
| 出力 | CSVダウンロード（BOMつきUTF-8） |

> **Ruby Wasmを選ぶ理由**: 集計ロジックをRubyで書くことで、将来的なサーバーサイド実装（Rails等）への移植が容易になる。また純粋な計算処理なのでWasmの制約に引っかかりにくい。

---

## ローデータ仕様

### CSVフォーマット

```
id,weight,q1,q2,q3_1,q3_2,q3_3,q4
1,1.23,1,3,1,0,1,2
2,0.87,2,1,0,1,1,1
3,1.45,1,2,1,1,0,3
```

- **1行目**: ヘッダー（変数名）
- **2行目以降**: データ（1行=1回答者）
- **文字コード**: UTF-8 または Shift-JIS（自動判定）
- **ウェイト値**: ローデータの1列として含める

### 列の種別

| 種別 | 説明 | 例 |
|------|------|----|
| `SA` | 単一回答 | `q1`, `q2` |
| `MA` | 複数回答（0/1フラグ列） | `q3_1`, `q3_2`, `q3_3` |
| `weight` | ウェイト値 | `weight`, `wt` |
| `id` | 回答者ID（集計除外） | `id` |
| `exclude` | 集計除外 | 任意 |

### MA列の命名規則

`プレフィックス_連番` の形式を想定。

```
q3_1, q3_2, q3_3  → MAグループ "q3" として自動検出
```

2列以上同じプレフィックスが連続していればMAと判定する。UIで手動修正も可能。

---

## アーキテクチャ

```
src/
├── main.ts                # エントリーポイント
├── components/
│   ├── Dropzone.ts        # CSVアップロードUI
│   ├── ColConfig.ts       # 列種別設定UI
│   ├── AggConfig.ts       # 集計設定UI（集計対象・クロス軸・ウェイト列）
│   └── ResultTable.ts     # 集計結果テーブル描画
├── lib/
│   ├── csv.ts             # CSVパース・文字コード判定
│   ├── colDetect.ts       # MA自動検出・列種別推定
│   ├── wasmBridge.ts      # Ruby Wasm初期化・呼び出しラッパー
│   └── download.ts        # CSV出力
└── ruby/
    └── aggregator.rb      # 集計ロジック（Ruby）
```

### JS ↔ Ruby Wasm 通信設計

JS側からRubyへはJSON文字列で渡し、RubyからもJSON文字列で返す。

```typescript
// wasmBridge.ts
async function runAggregation(payload: AggPayload): Promise<AggResult[]> {
  const json = JSON.stringify(payload);
  const result = vm.eval(`
    require 'json'
    Aggregator.new(JSON.parse('${json}')).run.to_json
  `);
  return JSON.parse(result.toString());
}
```

```ruby
# aggregator.rb
class Aggregator
  def initialize(payload)
    @data     = payload['data']      # [{col => val}, ...]
    @columns  = payload['columns']   # [{name:, type:, ma_group:}, ...]
    @weight   = payload['weight_col'] # 列名 or nil
    @mode     = payload['mode']      # 'gt' | 'cross' | 'weighted'
  end

  def run
    # ...
  end
end
```

#### payloadの構造

```json
{
  "data": [
    {"id": "1", "weight": "1.23", "q1": "1", "q3_1": "1", "q3_2": "0"},
    ...
  ],
  "columns": [
    {"name": "q1",   "type": "sa"},
    {"name": "q3_1", "type": "ma", "ma_group": "q3"},
    {"name": "q3_2", "type": "ma", "ma_group": "q3"}
  ],
  "weight_col": "weight",
  "mode": "gt"
}
```

---

## 集計仕様

### GT集計（単純集計）

- SA列: 値ごとに件数・%を集計
- MA列: グループ単位で選択肢ごとに件数・%を集計
- %の分母: **回答者ベース**（n = 全回答者数 or ウェイト合計）

**出力イメージ（SA）**

| q1 | 件数 | % |
|----|------|---|
| 1  | 120  | 48.0% |
| 2  | 80   | 32.0% |
| 3  | 50   | 20.0% |
| **n** | **250** | — |

**出力イメージ（MA）**

| q3 | 件数 | % |
|----|------|---|
| q3_1（選択肢A） | 130 | 52.0% |
| q3_2（選択肢B） | 90  | 36.0% |
| q3_3（選択肢C） | 60  | 24.0% |
| **n** | **250** | — |

### クロス集計（フェーズ2）

- 行軸・列軸をUIで指定
- 列軸のセルごとにn（ベース）を計算
- SA × SA のみ対応（フェーズ2）、MA対応はフェーズ3以降

### ウェイトバック集計

- 件数をウェイト値の合計で置き換えるだけ
- GT・クロスどちらにも適用可能
- UIでON/OFFを切り替え（ウェイト列が設定済みの場合のみ有効）

---

## UI設計

### 画面構成

```
┌─ header ─────────────────────────────┐
│ Temotto                 [Wasm状態]   │
├─ left panel ─────┬─ right panel ─────┤
│                  │                   │
│ 01. CSV読み込み  │  集計結果          │
│                  │                   │
│ 02. 列種別設定   │  ┌─ q1 [SA] ─┐   │
│                  │  │ 1: 48.0%  │   │
│ 03. 集計設定     │  │ 2: 32.0%  │   │
│  - ウェイト列    │  └───────────┘   │
│  - 集計対象列    │                   │
│                  │  ┌─ q3 [MA] ─┐   │
│ [▶ 集計実行]    │  │ q3_1: 52% │   │
│                  │  └───────────┘   │
│ [CSV出力]       │                   │
└──────────────────┴───────────────────┘
```

### Ruby Wasm ローディング

初回ロードに3〜10秒かかるため、起動時にバックグラウンドで先読みする。

```
アプリ起動 → Wasmダウンロード開始（バックグラウンド）
ユーザーがCSV読み込み・列設定を行う間にWasmが完了
→ 集計実行ボタンを押す頃にはReady状態
```

ステータスはヘッダーに常時表示: `● loading...` → `● ready`

---

## 実装フェーズ

### Phase 1 — GT集計（現在）

- [x] CSVアップロード・パース
- [x] 列種別自動検出（SA/MA/weight/id）
- [x] GT集計（JS実装でプロトタイプ確認済み）
- [ ] Viteプロジェクト構成に移行
- [ ] Ruby Wasm初期化・通信実装（`wasmBridge.ts`）
- [ ] `aggregator.rb` にGT集計ロジックを移植
- [ ] 結果テーブルUI（バーチャート付き）
- [ ] CSVダウンロード

### Phase 2 — クロス集計

- [ ] クロス集計UI（行軸・列軸選択）
- [ ] `aggregator.rb` にクロス集計を追加
- [ ] クロス表の描画（列ごとにn表示）

### Phase 3 — 品質・UX改善

- [ ] Shift-JIS自動判定
- [ ] エラーハンドリング強化
- [ ] 大量データ（1万件超）のパフォーマンス検証
- [ ] Excel（xlsx）出力対応

---

## ファイル・ディレクトリ構成（初期）

```
temotto/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.ts
│   ├── style.css
│   ├── components/
│   │   ├── Dropzone.ts
│   │   ├── ColConfig.ts
│   │   ├── AggConfig.ts
│   │   └── ResultTable.ts
│   ├── lib/
│   │   ├── csv.ts
│   │   ├── colDetect.ts
│   │   ├── wasmBridge.ts
│   │   └── download.ts
│   └── ruby/
│       └── aggregator.rb
└── public/
```

---

## 開発環境セットアップ

```bash
# プロジェクト作成
npm create vite@latest temotto -- --template vanilla-ts
cd temotto
npm install

# 依存ライブラリ
npm install papaparse @types/papaparse
npm install @ruby/wasm-wasi @ruby/3.3-wasm-wasi

# 開発サーバー起動
npm run dev
```

### vite.config.ts の注意点

Ruby WasmはSharedArrayBufferを使うため、開発サーバーにCORSヘッダーが必要。

```typescript
// vite.config.ts
export default {
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  }
}
```

---

## 参考リンク

- [ruby/ruby.wasm](https://github.com/ruby/ruby.wasm)
- [@ruby/wasm-wasi npm](https://www.npmjs.com/package/@ruby/wasm-wasi)
- [PapaParse](https://www.papaparse.com/)
