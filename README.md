# Tally

ブラウザだけで動くアンケートローデータ集計ツール。CSVとレイアウトJSONをアップロードするだけで、GT集計・クロス集計（ウェイトバック対応）が実行できる。サーバー不要。

## セットアップ

```bash
npm install
npm run dev
```

## 使い方

1. ローデータCSV（UTF-8、1行目ヘッダー）をドロップ
2. レイアウトJSON（設問定義）をドロップ
3. 必要に応じてクロス軸を選択
4. 「GT集計を実行」で集計 → 結果テーブル表示 & CSV出力

### レイアウトJSON形式

```json
[
  { "key": "q1", "type": "SA", "label": "性別", "items": [{"code": "1", "label": "男性"}, {"code": "2", "label": "女性"}] },
  { "key": "q3", "type": "MA", "label": "利用メディア", "items": [{"code": "1", "label": "TV"}, {"code": "2", "label": "Web"}] },
  { "key": "weight", "type": "WEIGHT" },
  { "key": "id", "type": "ID" }
]
```

- **SA**: 単一回答（1列）
- **MA**: 複数回答（0/1フラグ列、`key_code` の命名規則）
- **WEIGHT**: ウェイト列（ウェイトバック集計に使用）
- **ID / EXCLUDE**: 集計除外列

## 技術スタック

TypeScript + Vite + DuckDB Wasm（SQL集計エンジン）。UIフレームワークなし。

## ビルド

```bash
npm run build    # 型チェック + ビルド
npm run preview  # ビルド結果をローカルで確認
```
