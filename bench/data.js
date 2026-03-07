window.BENCHMARK_DATA = {
  "lastUpdate": 1772863993508,
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
          "id": "e85577792c06b45d39a94392e3c3f3a7d615a875",
          "message": "Merge pull request #128 from Yuki-bach/refactor/move-prepare-date-layout-upstream\n\nrefactor: prepareDateLayoutをImportScreenの完了フローに移動",
          "timestamp": "2026-03-07T14:15:54+09:00",
          "tree_id": "6cdf3680983f197b85c72d5531201d83ee0c3d78",
          "url": "https://github.com/Yuki-bach/aggy/commit/e85577792c06b45d39a94392e3c3f3a7d615a875"
        },
        "date": 1772860596773,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, cross=none)",
            "value": 131.8,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, cross=SA×2)",
            "value": 220.3,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, cross=none)",
            "value": 445.2,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, cross=SA×2)",
            "value": 1321.6,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, cross=none)",
            "value": 288.1,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, cross=SA×2)",
            "value": 1010.7,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, cross=none)",
            "value": 107.4,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, cross=SA×2)",
            "value": 432.7,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, cross=none)",
            "value": 143.4,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, cross=MA×2)",
            "value": 1450.4,
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
          "id": "3909b86f13a50000a18b33336dde13fa8613ff48",
          "message": "Merge pull request #129 from Yuki-bach/worktree-rename-na-to-no-answer\n\nrefactor: NA_VALUE関連の変数名をNO_ANSWER_VALUE系にrename",
          "timestamp": "2026-03-07T14:33:02+09:00",
          "tree_id": "c0f9c0ad907d7416000b1c075eb275ff10a6d937",
          "url": "https://github.com/Yuki-bach/aggy/commit/3909b86f13a50000a18b33336dde13fa8613ff48"
        },
        "date": 1772861623335,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, cross=none)",
            "value": 111.7,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, cross=SA×2)",
            "value": 201.9,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, cross=none)",
            "value": 417.3,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, cross=SA×2)",
            "value": 1301.4,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, cross=none)",
            "value": 295.7,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, cross=SA×2)",
            "value": 1010.4,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, cross=none)",
            "value": 106.7,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, cross=SA×2)",
            "value": 436.6,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, cross=none)",
            "value": 143.6,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, cross=MA×2)",
            "value": 1469.3,
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
          "id": "8583f8e1a15ac78767b746979aafee3b5d362da5",
          "message": "Merge pull request #130 from Yuki-bach/ci/benchmark-comment-always\n\nci: PRに毎回ベンチマーク結果をコメント",
          "timestamp": "2026-03-07T15:12:31+09:00",
          "tree_id": "2b15575fa21a910689627b53e255667f59c8560a",
          "url": "https://github.com/Yuki-bach/aggy/commit/8583f8e1a15ac78767b746979aafee3b5d362da5"
        },
        "date": 1772863992262,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 101.5,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 302.5,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 474.9,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 1361,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 289.6,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1005.7,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 104.8,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 454.1,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 142.7,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1431.6,
            "unit": "ms"
          }
        ]
      }
    ]
  }
}