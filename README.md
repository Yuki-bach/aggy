# Aggy

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

## AI分析コメント（Chrome Built-in AI）

集計実行後、Chrome の組み込み AI（Gemini Nano）が結果の傾向を自動で要約し、画面右下に吹き出しで表示します。非対応ブラウザでは自動的に非表示になります。

### 有効化手順（Chrome 138+）

1. `chrome://flags/#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**
2. `chrome://flags/#prompt-api-for-gemini-nano` → **Enabled**
3. Chrome を再起動
4. `chrome://components` → **Optimization Guide On Device Model** の「アップデートを確認」でモデルをダウンロード

## 技術スタック

TypeScript, Vite, Preact, DuckDB Wasm, Tailwind CSS v4

## コマンド

```bash
npm run dev        # 開発サーバー
npm run build      # 型チェック + ビルド
npm run preview    # ビルド結果をローカルで確認
npm run check      # フォーマット・lint・型チェック
npm run test       # テスト (vitest)
npm run lint       # oxlint
npm run fmt        # oxfmt
```
