window.BENCHMARK_DATA = {
  "lastUpdate": 1773410480196,
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
          "id": "a106508a70227b7a55ae50d46ce3582a3418f962",
          "message": "Merge pull request #133 from Yuki-bach/ci/benchmark-continue-on-error\n\nci: benchmark結果コメント投稿失敗時にCIを失敗させない",
          "timestamp": "2026-03-08T09:25:04+09:00",
          "tree_id": "886f2138e778610207dbb909c9a0751e3d7239b6",
          "url": "https://github.com/Yuki-bach/aggy/commit/a106508a70227b7a55ae50d46ce3582a3418f962"
        },
        "date": 1772929542550,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 117.2,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 216.6,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 333.9,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 1141.4,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 385.8,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1103.7,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 110.8,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 434.8,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 145.6,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1472.3,
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
          "id": "e805e090fffcf1d9ff8b7d26cf07aa53cebb4a28",
          "message": "Merge pull request #132 from Yuki-bach/feat/na-question-type\n\nfeat: NA (Numerical Answer) 設問タイプを追加",
          "timestamp": "2026-03-08T12:54:12+09:00",
          "tree_id": "e9253e813dfc04a8a5b5f03a32d89995fee72df2",
          "url": "https://github.com/Yuki-bach/aggy/commit/e805e090fffcf1d9ff8b7d26cf07aa53cebb4a28"
        },
        "date": 1772942095203,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 156.2,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 262.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 441.9,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 1357.2,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 292.9,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1008.1,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 106.1,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 430.8,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 142.1,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1456,
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
          "id": "3eab9452a35c2605a00b7e6969720893d5f88659",
          "message": "Merge pull request #134 from Yuki-bach/test/opfs-e2e\n\ntest: OPFS履歴機能のE2Eテストを追加",
          "timestamp": "2026-03-08T13:04:36+09:00",
          "tree_id": "50b610a605a61fe8c804b6f1f6abd223f93f90a5",
          "url": "https://github.com/Yuki-bach/aggy/commit/3eab9452a35c2605a00b7e6969720893d5f88659"
        },
        "date": 1772942719632,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 118.2,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 222.5,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 477.9,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 1301.1,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 293.6,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1023.7,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 109.6,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 435.7,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 144,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1502,
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
          "id": "ea3730a0817bbfd70c3f5c7310f1838e15490aa7",
          "message": "Merge pull request #135 from Yuki-bach/refactor/result-card-owns-body-selection\n\nrefactor: ResultCard/ResultView設計改善とContext廃止",
          "timestamp": "2026-03-08T15:54:50+09:00",
          "tree_id": "ff4578606efdddb6a428332cc2305d14c136109d",
          "url": "https://github.com/Yuki-bach/aggy/commit/ea3730a0817bbfd70c3f5c7310f1838e15490aa7"
        },
        "date": 1772952932192,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 78.1,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 224.3,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 323.7,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 1226.5,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 392.6,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1045.9,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 109.1,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 441.3,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 153,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1562.2,
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
          "id": "be5a6309c0bff82b9e0446219dc8feb7202c9285",
          "message": "Merge pull request #136 from Yuki-bach/refactor/rename-agg-result-to-output\n\nrefactor: AggResult → AggOutput にリネーム",
          "timestamp": "2026-03-08T16:03:20+09:00",
          "tree_id": "532a472a318c4fd3a19014ecf853855f70e349bc",
          "url": "https://github.com/Yuki-bach/aggy/commit/be5a6309c0bff82b9e0446219dc8feb7202c9285"
        },
        "date": 1772953441671,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 124.9,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 201.6,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 321.6,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 974.1,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 395.4,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1354.9,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 103.7,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 449.1,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 143.1,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1456,
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
          "id": "623956a96f5cf6bf7616cf6a8c61585e4b45ce1a",
          "message": "Merge pull request #137 from Yuki-bach/refactor/unify-tally-type\n\nrefactor: NumericTallyを統合し単一Tally型に統一",
          "timestamp": "2026-03-08T16:18:42+09:00",
          "tree_id": "ad755ef2e6a57ccebc6155f9fd188537cf59850d",
          "url": "https://github.com/Yuki-bach/aggy/commit/623956a96f5cf6bf7616cf6a8c61585e4b45ce1a"
        },
        "date": 1772954369433,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 153.7,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 253.2,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 390.2,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 1003.4,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 292,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1014.1,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 103.8,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 429.1,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 142.3,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1426.7,
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
          "id": "c2c08a8eda82d0148d29fb8fdfdcf7d4120b389b",
          "message": "Merge pull request #138 from Yuki-bach/refactor/remove-tally-group-wrapper\n\nrefactor: TallyGroupラッパーを除去しgtTally/crossTalliesを直接渡す",
          "timestamp": "2026-03-08T16:27:23+09:00",
          "tree_id": "0cb9bca1c0d934a1b4c9a4aa0eeef7f5cb26dd57",
          "url": "https://github.com/Yuki-bach/aggy/commit/c2c08a8eda82d0148d29fb8fdfdcf7d4120b389b"
        },
        "date": 1772954882670,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 130,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 215.1,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 317.4,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 997,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 288.7,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1001.7,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 107.4,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 432.2,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 145.6,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1446.2,
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
          "id": "59e9a812aecd570f59b3e44c1f577b3a861d35c7",
          "message": "Merge pull request #141 from Yuki-bach/docs/add-class-convention\n\ndocs: add class usage convention for shared state",
          "timestamp": "2026-03-08T16:59:41+09:00",
          "tree_id": "93f81bd93a1d94daa696188f817d57906523c3f7",
          "url": "https://github.com/Yuki-bach/aggy/commit/59e9a812aecd570f59b3e44c1f577b3a861d35c7"
        },
        "date": 1772956823384,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 138.8,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 243.1,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 542.9,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 1543,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 301.5,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1039,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 105.5,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 433.2,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 154.3,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1502,
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
          "id": "4b5f4e2b5b319f32a84e55a6f19cb6fc0e6f8b2f",
          "message": "Merge pull request #140 from Yuki-bach/refactor/minimize-types\n\nrefactor: type/interfaceの重複・冗長を整理",
          "timestamp": "2026-03-08T17:03:20+09:00",
          "tree_id": "ab4aec4ef3249fc9e607a548fc15955f3f611f11",
          "url": "https://github.com/Yuki-bach/aggy/commit/4b5f4e2b5b319f32a84e55a6f19cb6fc0e6f8b2f"
        },
        "date": 1772957038759,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 130.1,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 227.3,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 327.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 1018,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 417.5,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1355.8,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 107.1,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 436.7,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 145.9,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1460.6,
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
          "id": "dc0b73a37f6ef97c318bd4afdd377235dd573858",
          "message": "Merge pull request #139 from Yuki-bach/refactor/extract-settings-panel\n\nrefactor: AggregationScreenの左パネルをSettingsPanelに分離",
          "timestamp": "2026-03-12T08:23:43+09:00",
          "tree_id": "a68aa1c5e95208ec2562d36a7619a28537ec7be3",
          "url": "https://github.com/Yuki-bach/aggy/commit/dc0b73a37f6ef97c318bd4afdd377235dd573858"
        },
        "date": 1773271463717,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 113.7,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 207.4,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 322.5,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 1345.8,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 389.9,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1016.7,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 112.4,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 438.4,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 145.9,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1501.7,
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
          "id": "e7c68469ddf43b55b5035ef3936fcb392f7cf568",
          "message": "Merge pull request #144 from Yuki-bach/chore/beta-label\n\nchore: バージョン表記を v0.1 から β に変更",
          "timestamp": "2026-03-12T08:33:33+09:00",
          "tree_id": "6200b6070f3529d1e118921bda2e5afe52b4b5c3",
          "url": "https://github.com/Yuki-bach/aggy/commit/e7c68469ddf43b55b5035ef3936fcb392f7cf568"
        },
        "date": 1773272053108,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 111.6,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 256.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 323.9,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 1409.6,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 403.6,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1004.5,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 104.3,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 432.7,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 144.8,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1451.1,
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
          "id": "ce083e0bafe3797452efabc817e0bf3c90259148",
          "message": "Merge pull request #145 from Yuki-bach/ui/improve-help-button-label\n\nui: ヘルプボタンを「使い方」/「Guide」ラベル付きに変更",
          "timestamp": "2026-03-12T09:01:17+09:00",
          "tree_id": "5dc494d7cce9e4848bbaae80fab109fd7fde3cd9",
          "url": "https://github.com/Yuki-bach/aggy/commit/ce083e0bafe3797452efabc817e0bf3c90259148"
        },
        "date": 1773273715280,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 115.2,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 218.4,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 319.1,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 989.3,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 395.8,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1447.2,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 105.5,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 429.8,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 142.2,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1433,
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
          "id": "06caf9e13fb566888d807a9257ff2c52d1677fa2",
          "message": "Merge pull request #146 from Yuki-bach/skill/add-aggy-import\n\nskill: aggy-importスキルを追加",
          "timestamp": "2026-03-12T10:31:34+09:00",
          "tree_id": "3be75367f08f3d39ff81c84c4036b295e932a965",
          "url": "https://github.com/Yuki-bach/aggy/commit/06caf9e13fb566888d807a9257ff2c52d1677fa2"
        },
        "date": 1773279139215,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 105.6,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 312.7,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 484.6,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 1510.9,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 295.7,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1035.5,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 107.8,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 445.9,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 144.8,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1477.8,
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
          "id": "d84f8d428df436eb99fc2abc6f1034509d1d597b",
          "message": "Merge pull request #147 from Yuki-bach/refactor/rename-agg-functions\n\nrefactor: aggregateGt/aggregateCross を aggTotals/aggCrossTab にリネーム",
          "timestamp": "2026-03-13T09:05:44+09:00",
          "tree_id": "41398b6fb877aed761d0ff3d716b9778b58119b7",
          "url": "https://github.com/Yuki-bach/aggy/commit/d84f8d428df436eb99fc2abc6f1034509d1d597b"
        },
        "date": 1773360377924,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 53.7,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 160.4,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 289,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 944.2,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 282.8,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 969.7,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 101.5,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 413.9,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 147.8,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1447.6,
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
          "id": "924d6f031e2b8bae81c6b3b5221b413949dfae4b",
          "message": "Merge pull request #148 from Yuki-bach/chore/vite-8-upgrade\n\nchore: Vite 7 → 8 アップグレード (Rolldown)",
          "timestamp": "2026-03-13T09:29:36+09:00",
          "tree_id": "223b938680125b8db1383897b06da6b5bccbe268",
          "url": "https://github.com/Yuki-bach/aggy/commit/924d6f031e2b8bae81c6b3b5221b413949dfae4b"
        },
        "date": 1773361811620,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 52.2,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 141.2,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 267.1,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 956.1,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 275.7,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 949.8,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 99,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 408.7,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 137.6,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1406.2,
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
          "id": "7026396547a874cb9ac3a5bc8ea8fc5e580b373b",
          "message": "Merge pull request #150 from Yuki-bach/refactor/unify-terminology\n\nrefactor: 集計モジュールの用語を統一",
          "timestamp": "2026-03-13T23:00:44+09:00",
          "tree_id": "58968ad83e54cabe7a8d6215b3f75ae7da525be5",
          "url": "https://github.com/Yuki-bach/aggy/commit/7026396547a874cb9ac3a5bc8ea8fc5e580b373b"
        },
        "date": 1773410479861,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 52.8,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 149.7,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 268.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 895,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 289.1,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1000.9,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 103.5,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 422.7,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 142.8,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1433.1,
            "unit": "ms"
          }
        ]
      }
    ]
  }
}