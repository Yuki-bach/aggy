window.BENCHMARK_DATA = {
  "lastUpdate": 1772851995653,
  "repoUrl": "https://github.com/Yuki-bach/aggy",
  "entries": {
    "Benchmark": [
      {
        "commit": {
          "author": {
            "email": "56685372+Yuki-bach@users.noreply.github.com",
            "name": "Yuki Ogawa",
            "username": "Yuki-bach"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "8b79ec2d05384f55a2e9303931113888a54a368e",
          "message": "Merge pull request #125 from Yuki-bach/worktree-bench-tracking\n\nfeat: ベンチマーク結果の保存・比較機能を追加",
          "timestamp": "2026-03-07T10:47:27+09:00",
          "tree_id": "cf613b090437bdee4e877031caf6bfef5a292daa",
          "url": "https://github.com/Yuki-bach/aggy/commit/8b79ec2d05384f55a2e9303931113888a54a368e"
        },
        "date": 1772848092665,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, cross=none)",
            "value": 68.6,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, cross=SA×2)",
            "value": 295.1,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, cross=none)",
            "value": 467.6,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, cross=SA×2)",
            "value": 968.1,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, cross=none)",
            "value": 287.5,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, cross=SA×2)",
            "value": 1030.1,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, cross=none)",
            "value": 104.5,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, cross=SA×2)",
            "value": 436.1,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, cross=none)",
            "value": 142.7,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, cross=MA×2)",
            "value": 1428.8,
            "unit": "ms"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "56685372+Yuki-bach@users.noreply.github.com",
            "name": "Yuki Ogawa",
            "username": "Yuki-bach"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "0cb021915d5ebc4dc3970bfb2e554412881de00b",
          "message": "Merge pull request #126 from Yuki-bach/feat/playwright-e2e\n\nfeat: Playwright E2Eテストを導入（Chromium/Firefox/WebKit）",
          "timestamp": "2026-03-07T11:14:49+09:00",
          "tree_id": "79077e6f298df0a42b2c475a80ce2407f7f47485",
          "url": "https://github.com/Yuki-bach/aggy/commit/0cb021915d5ebc4dc3970bfb2e554412881de00b"
        },
        "date": 1772849730595,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, cross=none)",
            "value": 120.4,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, cross=SA×2)",
            "value": 207.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, cross=none)",
            "value": 348.4,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, cross=SA×2)",
            "value": 1387.6,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, cross=none)",
            "value": 288.8,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, cross=SA×2)",
            "value": 1001.2,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, cross=none)",
            "value": 104.2,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, cross=SA×2)",
            "value": 429.5,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, cross=none)",
            "value": 142.5,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, cross=MA×2)",
            "value": 1430.1,
            "unit": "ms"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "56685372+Yuki-bach@users.noreply.github.com",
            "name": "Yuki Ogawa",
            "username": "Yuki-bach"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "4695093df7e46a586901c9de5390b9d3fa7ce3a3",
          "message": "Merge pull request #127 from Yuki-bach/refactor/invert-resultcard-ownership\n\nrefactor: ResultCardとTableContent/ChartContentの関係を逆転",
          "timestamp": "2026-03-07T11:52:33+09:00",
          "tree_id": "8a59a869b4332f2f9a1cf4a274b1b97643fb2885",
          "url": "https://github.com/Yuki-bach/aggy/commit/4695093df7e46a586901c9de5390b9d3fa7ce3a3"
        },
        "date": 1772851995089,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, cross=none)",
            "value": 125.1,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, cross=SA×2)",
            "value": 331,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, cross=none)",
            "value": 437.4,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, cross=SA×2)",
            "value": 1355.4,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, cross=none)",
            "value": 307.3,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, cross=SA×2)",
            "value": 1030.6,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, cross=none)",
            "value": 105.8,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, cross=SA×2)",
            "value": 443,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, cross=none)",
            "value": 144.9,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, cross=MA×2)",
            "value": 1485.2,
            "unit": "ms"
          }
        ]
      }
    ]
  }
}