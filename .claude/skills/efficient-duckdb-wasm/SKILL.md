---
name: efficient-duckdb-wasm
description: ブラウザで DuckDB Wasm (@duckdb/duckdb-wasm) を使うときの効率的な実装パターンと落とし穴のリファレンス。バンドル選択、Web Worker、ファイル登録 (registerFileText/Buffer/Handle/URL)、query vs send、Arrow 連携、メモリ/パフォーマンスの注意点をカバーする。`AsyncDuckDB` を初期化したり CSV/Parquet をブラウザで読み書きしたり SQL を実行するコードを書く・レビューするときは必ず参照すること。
---

# Efficient DuckDB Wasm

ブラウザで [`@duckdb/duckdb-wasm`](https://duckdb.org/2021/10/29/duckdb-wasm) を使うときの実装ガイドライン。公式ブログ記事 (2021-10-29) の推奨に基づく。「なぜそうするか」を理解した上で適用すること。

## 1. バンドル選択と初期化

DuckDB Wasm は MVP / EH (Exception Handling) / COI (Cross-Origin Isolated) など複数のビルドを提供している。ブラウザの機能サポートに応じて `selectBundle` で自動選択する。

```ts
import * as duckdb from "@duckdb/duckdb-wasm";

const BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: `${CDN}/duckdb-mvp.wasm`,
    mainWorker: `${CDN}/duckdb-browser-mvp.worker.js`,
  },
  eh: {
    mainModule: `${CDN}/duckdb-eh.wasm`,
    mainWorker: `${CDN}/duckdb-browser-eh.worker.js`,
  },
};

const bundle = await duckdb.selectBundle(BUNDLES);
const worker = new Worker(bundle.mainWorker!);
const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
```

**なぜ:** EH ビルドは Wasm ネイティブ例外を使うため、Chrome 系では大幅に速い。MVP は古いブラウザ向けのフォールバックとして JS で例外をエミュレートするので遅くなる。`selectBundle` に任せれば各ブラウザに最適なビルドが選ばれる。

**Tips:**

- CDN 直リンクが CORS で弾かれる環境では、`new Blob([\`importScripts("${bundle.mainWorker}");\`])` から ObjectURL を作って Worker を生成する回避策が使える。
- 本番では `ConsoleLogger` ではなく `VoidLogger` を使うとログのオーバーヘッドが減る。

## 2. Web Worker は必須

`AsyncDuckDB` は内部で Web Worker にクエリを投げ、メインスレッドをブロックしない。**必ず `AsyncDuckDB` を使うこと**。`DuckDB`（同期版）はメインスレッドで動くので UI を固める。

**シングルワーカー＝シングルスレッド実行:** DuckDB Wasm は Worker 1 つの上でクエリを順次処理する。同一接続に対して `Promise.all` で並列にクエリを投げても内部でシリアライズされるだけなので、コードは常に `await` で逐次実行する。

```ts
// ❌ NG: 並列に見えるが内部でシリアライズされ、ハンドリングが複雑になるだけ
const [a, b] = await Promise.all([conn.query(sqlA), conn.query(sqlB)]);

// ✅ OK: 素直に逐次
const a = await conn.query(sqlA);
const b = await conn.query(sqlB);
```

## 3. 並列実行を本当に有効にしたい場合 (COOP/COEP)

DuckDB は内部でマルチスレッド実行をサポートしているが、それには `SharedArrayBuffer` が必要で、ブラウザは Cross-Origin Isolation を要求する。サーバから以下のヘッダを返す必要がある:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy:  same-origin
```

**トレードオフ:** これらのヘッダを設定すると、CORP ヘッダのない外部リソース（画像、iframe、OAuth ポップアップ、解析タグなど）が読み込めなくなる。サードパーティ統合がある場合は副作用を確認すること。多くの一般用途では COI を諦めて単一スレッドで動かす方が現実的。

## 4. データ取り込み: registerFile\* の使い分け

DuckDB Wasm は仮想 FS を持っており、`registerFile*` 系で「DuckDB から見えるファイル」として登録した上で、SQL から `read_csv('name')` / `parquet_scan('name')` で読む。元データの形態に応じて適切な API を選ぶ。

| API                                    | 入力                  | 用途                                        | メモリ効率                       |
| -------------------------------------- | --------------------- | ------------------------------------------- | -------------------------------- |
| `registerFileText(name, string)`       | JS 文字列             | テキストを直接埋め込む / テストデータ       | △ UTF-16 で約2倍に膨らむ         |
| `registerFileBuffer(name, Uint8Array)` | バイナリ              | `await file.arrayBuffer()` した CSV/Parquet | ◎ 元バイト数のまま               |
| `registerFileHandle(name, File, ...)`  | `File` (input/picker) | ローカルの大きいファイル                    | ◎ 必要なバイトだけ Wasm 側に渡る |
| `registerFileURL(name, url, ...)`      | リモート URL          | CDN 上の Parquet 等                         | ◎ Range Request で部分読み込み可 |

**重要なガイドライン:**

- ユーザがアップロードする CSV/Parquet は `File` を **そのまま `registerFileHandle`** に渡すのが基本。`await file.text()` で文字列化してから `registerFileText` するのは、UTF-16 でメモリを約 2 倍消費する上、Wasm 境界を越える際にもう一度コピーが必要なのでアンチパターン。
- どうしてもバイト列を持っているなら `registerFileBuffer`。
- リモートの Parquet は `registerFileURL` + `parquet_scan` で「メタデータだけ読む」「必要な行グループだけ DL する」といった部分読み込みが効く（後述）。

```ts
// 推奨パターン: File をそのまま渡す
await db.registerFileHandle(
  "data.csv",
  file, // <input type="file"> の File
  duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
  true, // direct I/O
);
await conn.query(`CREATE TABLE t AS SELECT * FROM read_csv('data.csv')`);
```

代替として型付きインポート (`insertCSVFromPath`, `insertJSONFromPath`, `insertArrowTable`) もあるが、列型を細かく指定したいときや Arrow から直接流し込みたいとき以外は SQL の `read_csv` / `parquet_scan` で十分。

## 5. クエリ結果: query() vs send()

DuckDB Wasm の結果は **Apache Arrow Table** で返ってくる。これは記事が強調する核心部分:

- **カラムナ形式** で zero-copy 読み取りができる
- JSON ↔ JS のシリアライズコストを回避できる
- Arquero など他の Arrow ベースツールにそのまま渡せる

```ts
// 全件マテリアライズ (結果が小さいとき)
const result = await conn.query<{ n: arrow.Int32 }>(`SELECT count(*) AS n FROM t`);
const n = Number(result.toArray()[0].n);

// ストリーミング (結果が大きいとき)
const stream = await conn.send(`SELECT * FROM big_table`);
for await (const batch of stream) {
  // batch は RecordBatch。逐次処理してメモリピークを下げる
  processBatch(batch);
}
```

**使い分けの目安:**

- 集計結果・小さい lookup → `query()`
- 全行スキャン・export 用ダンプ・行数が事前に読めない → `send()`

`toArray()` を呼ぶと JS オブジェクト配列に展開されてメモリを食うので、Arrow Table のままインデックスアクセスや `getChild('col').get(i)` で読む方が効率的なケースもある。大量のセルを触る集計ロジックでは特に意識する。

## 6. Prepared Statements

同じ形のクエリを引数だけ変えて何度も実行する場合、`prepare` を使うとパース・プラン作成のオーバーヘッドを 1 回に圧縮できる。

```ts
const stmt = await conn.prepare(`SELECT count(*) FROM t WHERE category = ?`);
for (const cat of categories) {
  const r = await stmt.query(cat);
  // ...
}
await stmt.close();
```

ただし**列名やテーブル名はパラメータにできない**ので、対象列が動的に変わるクエリには効かない。同形クエリ × 多数実行のときだけ検討する。

## 7. Parquet の部分読み込み

リモート Parquet は `registerFileURL` で登録すると HTTP Range Request でフッタ・必要行グループだけを取りに行ける。これは Parquet を選ぶ最大の理由の一つ。

```ts
// メタデータだけ読む (フッタのみ DL)
await conn.query(`SELECT count(*) FROM parquet_scan('https://.../events.parquet')`);

// 述語プッシュダウン: 必要な行グループだけ DL される
await conn.query(`
  SELECT user_id, ts FROM parquet_scan('https://.../events.parquet')
  WHERE date = '2024-01-01'
`);
```

サーバ側で `Accept-Ranges: bytes` と CORS ヘッダ (`Access-Control-Allow-Origin`, `Access-Control-Expose-Headers: Content-Length, Content-Range`) を返す必要がある。

## 8. 落とし穴と注意点

1. **永続化はない。** DuckDB Wasm にはまだ IndexedDB や OPFS への自動永続化が無い（記事執筆時点）。リロードでテーブルは消える。永続化が要るなら、結果を Arrow IPC や Parquet にダンプして自前で `localStorage` / IndexedDB / OPFS に保存する。
2. **メインスレッドからの呼び出しは Wasm 境界を毎回越える。** 細かいクエリを大量に投げると境界コストが効いてくる。可能なら 1 本の SQL にまとめる方が速い (`UNION ALL`, `GROUP BY GROUPING SETS`, ウィンドウ関数など)。
3. **JS 配列で結果を受け取らない。** 大規模結果を `toArray()` してから JS で集計するのは Arrow の利点を捨てる行為。集計ロジックは可能な限り SQL 側で書く。
4. **接続は使い回す。** `db.connect()` で得た `AsyncDuckDBConnection` は long-lived で良い。リクエストごとに connect/close するとオーバーヘッドが乗る。
5. **`Promise.all` で同一接続に並列に投げない。** §2 参照。
6. **エラー時のクリーンアップ。** `prepare` / `send` で開いたリソースは `close()` で解放する（特に長時間動くアプリでは）。

## 9. コードレビュー時のチェックリスト

DuckDB Wasm を使ったコードを見るとき、上から順に確認する:

- [ ] `AsyncDuckDB` を Web Worker 上で動かしているか（同期版を使っていないか）
- [ ] `selectBundle` で MVP/EH を切り替えているか
- [ ] CSV/Parquet を `File` のまま `registerFileHandle` に渡しているか（`await file.text()` していないか）
- [ ] 同一接続のクエリを `Promise.all` していないか
- [ ] 大きな結果に対して `query()` ではなく `send()` でストリーミングしているか
- [ ] 集計ロジックが JS 側ではなく SQL 側で書かれているか
- [ ] 同形クエリの繰り返しに `prepare` を検討したか
- [ ] リモート Parquet で述語プッシュダウンが効く形になっているか
- [ ] 本番ビルドで `VoidLogger` 等を使っているか

## 参考リンク

- 公式記事: <https://duckdb.org/2021/10/29/duckdb-wasm>
- API ドキュメント: <https://shell.duckdb.org/docs/>
- GitHub: <https://github.com/duckdb/duckdb-wasm>
