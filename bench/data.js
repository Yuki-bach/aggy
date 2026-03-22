window.BENCHMARK_DATA = {
  "lastUpdate": 1774170462998,
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
          "id": "7bceafaf0e02eb6a66dc3cf3845851bd850eeea2",
          "message": "Merge pull request #151 from Yuki-bach/refactor/duckdb-rename-and-dependency-fix\n\nrefactor: duckdbBridge → duckdb リネーム＆依存方向修正",
          "timestamp": "2026-03-13T23:10:43+09:00",
          "tree_id": "8ddcd7a4694f7f8aed7ba4c8df603dc70cda99ce",
          "url": "https://github.com/Yuki-bach/aggy/commit/7bceafaf0e02eb6a66dc3cf3845851bd850eeea2"
        },
        "date": 1773411083871,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 50,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 160.3,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 291.9,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 937.1,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 265.7,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 961.1,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 98.6,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 410.6,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 140.8,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1445.9,
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
          "id": "07bb6a07797c23475be476da44f8352707c456bb",
          "message": "Merge pull request #153 from Yuki-bach/refactor/rename-gt-to-grandTotal\n\nrefactor: gt/totals → grandTotal にユビキタス言語を統一",
          "timestamp": "2026-03-14T17:08:33+09:00",
          "tree_id": "600d8dba534e5c70219e9291cc87065166addf0f",
          "url": "https://github.com/Yuki-bach/aggy/commit/07bb6a07797c23475be476da44f8352707c456bb"
        },
        "date": 1773475750772,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 51.9,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 136.4,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 279.1,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 933.6,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 257.5,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 962.9,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 103.2,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 408.3,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 139.2,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1415.1,
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
          "id": "7a40542ebea93a4fe72c560d48310080093d3e94",
          "message": "Merge pull request #155 from Yuki-bach/fix/remove-optional-callback-param\n\nfix: StatusListener コールバックの不要な省略可能パラメータを削除",
          "timestamp": "2026-03-14T21:49:39+09:00",
          "tree_id": "4d0f1b25581ba598c76ec116868cc6b8d4023e2b",
          "url": "https://github.com/Yuki-bach/aggy/commit/7a40542ebea93a4fe72c560d48310080093d3e94"
        },
        "date": 1773492615909,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 54.3,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 148.3,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 293.6,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 959.3,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 265.6,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 956.5,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 100.1,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 412.4,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 139.8,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1413.8,
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
          "id": "4d5b261bc12a5f09e3981e772ecc751e7a3c8424",
          "message": "Merge pull request #154 from Yuki-bach/refactor/unify-naming-pctDirection-weightCol\n\nrefactor: PctDirection → Basis にリネームし wCol → activeWeightCol に統一",
          "timestamp": "2026-03-14T21:50:17+09:00",
          "tree_id": "1a75bbaaebb26ccc6d0fe0bb168cbdaa43f13d0c",
          "url": "https://github.com/Yuki-bach/aggy/commit/4d5b261bc12a5f09e3981e772ecc751e7a3c8424"
        },
        "date": 1773492653550,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 93.3,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 151.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 306.9,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 925.9,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 266.1,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 966.4,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 98.3,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 410.4,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 139.5,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1424.2,
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
          "id": "b89196a1d4aa7a6bb7201b6090cf1a509448b1da",
          "message": "Merge pull request #156 from Yuki-bach/refactor/move-no-answer-value-to-constants\n\nrefactor: NO_ANSWER_VALUE を sqlHelpers から constants.ts に移動",
          "timestamp": "2026-03-14T21:52:41+09:00",
          "tree_id": "7baf262c9b85d9c9908be3711cd6291e8cc66ee8",
          "url": "https://github.com/Yuki-bach/aggy/commit/b89196a1d4aa7a6bb7201b6090cf1a509448b1da"
        },
        "date": 1773492796628,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 53.2,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 136.4,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 270.9,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 917.3,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 280.4,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 983,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 99.3,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 408.3,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 140.3,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1438.7,
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
          "id": "92b341311a5446244d7344a6edffbbde85e85f9b",
          "message": "Merge pull request #157 from Yuki-bach/refactor/tally-card-body-structure\n\nrefactor: CardBody を viewMode × isNA の 2×2 構造に整理",
          "timestamp": "2026-03-14T22:04:25+09:00",
          "tree_id": "a205d448f4c2f20c1c6e09525ea967d900d4c4a3",
          "url": "https://github.com/Yuki-bach/aggy/commit/92b341311a5446244d7344a6edffbbde85e85f9b"
        },
        "date": 1773493500165,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 71.7,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 142.2,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 263.7,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 932.7,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 292.4,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 976.7,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 99.6,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 409,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 146.9,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1457.5,
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
          "id": "fcb29a749c30fd7afbbed46111867e997d13f99d",
          "message": "Merge pull request #159 from Yuki-bach/refactor/buildAxis-guard-to-callsite\n\nrefactor: buildAxis の null ガードを呼び出し側に移動",
          "timestamp": "2026-03-14T22:19:33+09:00",
          "tree_id": "9b8273cb63b0940b18e644d38f7a1135bdb73571",
          "url": "https://github.com/Yuki-bach/aggy/commit/fcb29a749c30fd7afbbed46111867e997d13f99d"
        },
        "date": 1773494408751,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 53.2,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 133.6,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 292.7,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 931.3,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 258.9,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 971.4,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 98.6,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 407.4,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 139.6,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1417.8,
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
          "id": "ccd3f84b3b709e2df6af5365dcd784489b6ac9eb",
          "message": "Merge pull request #160 from Yuki-bach/refactor/layout-discriminated-union\n\nrefactor: LayoutEntry を Discriminated Union に変更",
          "timestamp": "2026-03-14T22:34:54+09:00",
          "tree_id": "f855dc04c81683c73064a9aa402adff0b3b135b3",
          "url": "https://github.com/Yuki-bach/aggy/commit/ccd3f84b3b709e2df6af5365dcd784489b6ac9eb"
        },
        "date": 1773495329963,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 53.9,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 151.2,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 265.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 916.9,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 303.1,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1034,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 103.1,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 420.3,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 151,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1473.6,
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
          "id": "affd3c8a04c0fb4b778e0c5901a890cb9099a721",
          "message": "Merge pull request #162 from Yuki-bach/refactor/validateData-diagnostics\n\nrefactor: validateData を Diagnostics 型に統一し設問タイプ別バリデータに分離",
          "timestamp": "2026-03-14T23:28:22+09:00",
          "tree_id": "805de6e671a6a03fb68a3b744365c78a28b37d61",
          "url": "https://github.com/Yuki-bach/aggy/commit/affd3c8a04c0fb4b778e0c5901a890cb9099a721"
        },
        "date": 1773498541179,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 56.7,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 146.7,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 275.4,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 974.5,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 282.3,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1007,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 104.3,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 419,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 145,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1425.9,
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
          "id": "58a7aa03471d8fde96d84e3b74c00ea5d676e6d5",
          "message": "Merge pull request #163 from Yuki-bach/test/agg-na-grand-total-pbt\n\ntest: aggNaGrandTotal の PBT テストを追加",
          "timestamp": "2026-03-14T23:31:18+09:00",
          "tree_id": "e9b67a656f5c5b045dbf8e4269c58f09ff0e0db3",
          "url": "https://github.com/Yuki-bach/aggy/commit/58a7aa03471d8fde96d84e3b74c00ea5d676e6d5"
        },
        "date": 1773498711588,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 54.9,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 155.5,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 291.7,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 911.7,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 271,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 962.1,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 97.9,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 413.2,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 141.3,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1431.8,
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
          "id": "508649d174fb697ff51db7fd2a1063ee8a9b9376",
          "message": "Merge pull request #164 from Yuki-bach/test/oracle-pbt-aggregation\n\ntest: add oracle PBT for aggregation (SA GT, MA GT, SA×SA Cross)",
          "timestamp": "2026-03-14T23:34:49+09:00",
          "tree_id": "1950daafa4a523f98573486f756b043b19db3b0e",
          "url": "https://github.com/Yuki-bach/aggy/commit/508649d174fb697ff51db7fd2a1063ee8a9b9376"
        },
        "date": 1773498920845,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 54.2,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 133.7,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 270.1,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 907.4,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 279.9,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1008.5,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 103.6,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 412.9,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 149,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1459.1,
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
          "id": "e6eeb0fec14566b15af9859e3e0e3f259247bdb0",
          "message": "Merge pull request #161 from Yuki-bach/refactor/formatLoadedInfo-guard-to-callsite\n\nrefactor: formatLoadedInfo の null ガードを呼び出し側に移動",
          "timestamp": "2026-03-14T23:41:31+09:00",
          "tree_id": "817c90edaad77b21161be59c86d3693f81ea4410",
          "url": "https://github.com/Yuki-bach/aggy/commit/e6eeb0fec14566b15af9859e3e0e3f259247bdb0"
        },
        "date": 1773499329577,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 57.9,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 158.6,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 288.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 948.6,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 267,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 963.3,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 100.4,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 406.1,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 139.9,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1473.4,
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
          "id": "561e84232eb10ca2ae18f49e43b007da8fdb67ae",
          "message": "Merge pull request #166 from Yuki-bach/refactor/csv-to-rawdata\n\nrefactor: csv/csvData → rawData に命名統一",
          "timestamp": "2026-03-15T00:07:18+09:00",
          "tree_id": "1b0c45709b0caced7e9fa55b4aa9b07dadee80e9",
          "url": "https://github.com/Yuki-bach/aggy/commit/561e84232eb10ca2ae18f49e43b007da8fdb67ae"
        },
        "date": 1773500878052,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 54.4,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 144.6,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 294.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 1005.5,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 283.6,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1006.2,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 105.1,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 422.3,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 150.1,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1568.4,
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
          "id": "16d5b63b404151a8c466ac03b7be5b1080863ee5",
          "message": "Merge pull request #167 from Yuki-bach/test/pbt-generator-diversity\n\ntest: PBTジェネレータの選択肢数・nullRateをシード由来に変動させる",
          "timestamp": "2026-03-15T00:18:25+09:00",
          "tree_id": "e8b1b1b94ee19c5669b922c2f658007007f8f677",
          "url": "https://github.com/Yuki-bach/aggy/commit/16d5b63b404151a8c466ac03b7be5b1080863ee5"
        },
        "date": 1773501539537,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 89.7,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 162.7,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 270.4,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 918.8,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 276.2,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 964.4,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 103.3,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 411,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 141.4,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1432.4,
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
          "id": "611cd88be4530b9ea780d44ac71258d9e8224360",
          "message": "Merge pull request #169 from Yuki-bach/chore/add-vitest-coverage\n\nchore: add @vitest/coverage-v8 for test coverage reporting",
          "timestamp": "2026-03-15T00:22:56+09:00",
          "tree_id": "cee86f6f4f2ecdc939148d7635e8c8a2e7175460",
          "url": "https://github.com/Yuki-bach/aggy/commit/611cd88be4530b9ea780d44ac71258d9e8224360"
        },
        "date": 1773501811687,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 55.1,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 134.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 276.7,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 947.5,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 288.8,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 990.4,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 99.4,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 403.8,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 141.6,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1472.9,
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
          "id": "8abe3c194d9077031585ce8242c8ef1fe822c3d0",
          "message": "Merge pull request #170 from Yuki-bach/claude/rename-aggregation-classes-ODLCt",
          "timestamp": "2026-03-15T15:29:08+09:00",
          "tree_id": "052116a4abbc304da8e5e6fa2b1edd2c642a674d",
          "url": "https://github.com/Yuki-bach/aggy/commit/8abe3c194d9077031585ce8242c8ef1fe822c3d0"
        },
        "date": 1773556188482,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 63.7,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 151.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 279.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 966.6,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 270.2,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1056.5,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 106.6,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 432.7,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 144.9,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1639,
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
          "id": "6d82df5ece6cba10e5c37631cb591e245ec2b85f",
          "message": "Merge pull request #171 from Yuki-bach/claude/review-type-names-2kLgp",
          "timestamp": "2026-03-15T16:27:27+09:00",
          "tree_id": "b5368fdf647e929f514cd38feb9b07eb299b150e",
          "url": "https://github.com/Yuki-bach/aggy/commit/6d82df5ece6cba10e5c37631cb591e245ec2b85f"
        },
        "date": 1773559680169,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 53.4,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 139.9,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 257.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 895.3,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 286.4,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 984.9,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 101.8,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 404.4,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 140.2,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1404.6,
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
          "id": "442a08c0110ebe2e276f87b666a0144982789b59",
          "message": "Merge pull request #168 from Yuki-bach/refactor/layout-validation-to-step2\n\nrefactor: レイアウトJSON構造バリデーションをStep 2に移動",
          "timestamp": "2026-03-15T16:47:05+09:00",
          "tree_id": "6f7630f09b476b32899eafe16633457901723c21",
          "url": "https://github.com/Yuki-bach/aggy/commit/442a08c0110ebe2e276f87b666a0144982789b59"
        },
        "date": 1773560861083,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 68.5,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 142.6,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 276.1,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 949.7,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 277.8,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 959.6,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 100.7,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 409.1,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 141,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1434,
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
          "id": "ddff7b94a13f4e1bbb411aed7e77c52c7958e29e",
          "message": "Merge pull request #172 from Yuki-bach/claude/validate-layout-items-and-duplicates\n\nfix: add missing validations to validateLayoutStructure",
          "timestamp": "2026-03-15T17:00:21+09:00",
          "tree_id": "4a4bf0999b5a730b6aed1af58e08ec2214234c77",
          "url": "https://github.com/Yuki-bach/aggy/commit/ddff7b94a13f4e1bbb411aed7e77c52c7958e29e"
        },
        "date": 1773561655878,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 54,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 130.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 279.7,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 895.6,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 278.5,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 973.9,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 99.1,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 396.1,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 141.4,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1430.2,
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
          "id": "4712db5acdebd8c0ef7b24f88d796a6de69eafc4",
          "message": "Merge pull request #173 from Yuki-bach/test/export-formatter-coverage\n\ntest: add NA/MA/edge-case coverage for export formatters",
          "timestamp": "2026-03-15T17:26:25+09:00",
          "tree_id": "2fa7c4d0a74845d1a77e051ff3a0d6030d9cdbbb",
          "url": "https://github.com/Yuki-bach/aggy/commit/4712db5acdebd8c0ef7b24f88d796a6de69eafc4"
        },
        "date": 1773563218232,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 51,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 134.5,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 274.9,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 925.5,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 281,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1039.8,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 103.1,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 412.2,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 150.9,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1515.9,
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
          "id": "c960d17dc3c2cd2a7613ab9692a2ec10b967ac2f",
          "message": "Merge pull request #174 from Yuki-bach/claude/check-aggtab-return-type-i4Pqv",
          "timestamp": "2026-03-17T21:11:57+09:00",
          "tree_id": "b4485f92baa9510abb4a10e765949a81ee926703",
          "url": "https://github.com/Yuki-bach/aggy/commit/c960d17dc3c2cd2a7613ab9692a2ec10b967ac2f"
        },
        "date": 1773749552853,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 56.1,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 144.3,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 280.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 919.4,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 323.8,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1051.6,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 108.5,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 436.9,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 148.3,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1480,
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
          "id": "2fa4538f971ffb5c02a237eaca2d70ae2ab6164a",
          "message": "Merge pull request #175 from Yuki-bach/claude/review-duckdb-imports-YRXxP",
          "timestamp": "2026-03-17T21:20:00+09:00",
          "tree_id": "5d69150a58bc8c76f384dfbc36eb4cc58b1544fa",
          "url": "https://github.com/Yuki-bach/aggy/commit/2fa4538f971ffb5c02a237eaca2d70ae2ab6164a"
        },
        "date": 1773750035300,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 53.3,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 136.3,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 273.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 904.1,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 263.7,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1004,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 100,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 410.8,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 140.4,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1410.8,
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
          "id": "656302459a6820550b915daa86609a34dd09c7ea",
          "message": "Merge pull request #177 from Yuki-bach/claude/fix-zero-division-percentage-7ZguV",
          "timestamp": "2026-03-18T05:55:58+09:00",
          "tree_id": "c41011d565d9257b4f392d888b1b7278c009b521",
          "url": "https://github.com/Yuki-bach/aggy/commit/656302459a6820550b915daa86609a34dd09c7ea"
        },
        "date": 1773780997877,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 54.5,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 138.4,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 267.3,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 951.3,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 269.5,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 951.7,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 100.1,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 406.7,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 142.6,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1493.9,
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
          "id": "b200db4926ea3ca303388be4b9497c3c1d1f1e4a",
          "message": "Merge pull request #176 from Yuki-bach/claude/review-buildtabs-naming-vileE",
          "timestamp": "2026-03-18T06:34:45+09:00",
          "tree_id": "4fe1934e7407e4d751c6da79372067918e48a3a8",
          "url": "https://github.com/Yuki-bach/aggy/commit/b200db4926ea3ca303388be4b9497c3c1d1f1e4a"
        },
        "date": 1773783321067,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 79.1,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 144.4,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 274.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 933.5,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 282,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1033.4,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 102,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 409.5,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 143.7,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1432.2,
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
          "id": "23843634080de6ffa3cf7d972c7a8ceb33dba1f2",
          "message": "Merge pull request #178 from Yuki-bach/claude/refactor-chart-config-ezmb6\n\nrefactor: encapsulate chart palette config behind getter functions",
          "timestamp": "2026-03-18T11:18:46+09:00",
          "tree_id": "ac83367ce46f2dd6c0fbee58a94854e816627238",
          "url": "https://github.com/Yuki-bach/aggy/commit/23843634080de6ffa3cf7d972c7a8ceb33dba1f2"
        },
        "date": 1773800358768,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 54.7,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 133,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 277.5,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 935,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 277.7,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 951.4,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 98.8,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 405.5,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 141.7,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1436,
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
          "id": "805673e548724e503100e58b04f29ec93e2d9481",
          "message": "Merge pull request #179 from Yuki-bach/claude/check-duckdb-export-tests-J70iU",
          "timestamp": "2026-03-18T17:15:11+09:00",
          "tree_id": "0d37cb5785121107a9e8bcdb80976bf083fe6cb5",
          "url": "https://github.com/Yuki-bach/aggy/commit/805673e548724e503100e58b04f29ec93e2d9481"
        },
        "date": 1773821749978,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 57.9,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 149.4,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 278.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 976.4,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 350.9,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1058.7,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 106.2,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 435.7,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 146.2,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1565.6,
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
          "id": "3b0fe2319300dd25c3d2114e8d80a4bf9830e249",
          "message": "Merge pull request #180 from Yuki-bach/claude/merge-clipboard-download-75PCu",
          "timestamp": "2026-03-18T17:26:20+09:00",
          "tree_id": "3bb9e0a23cd3e55e6b3983a56dd4555f69f0acee",
          "url": "https://github.com/Yuki-bach/aggy/commit/3b0fe2319300dd25c3d2114e8d80a4bf9830e249"
        },
        "date": 1773822419515,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 53.1,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 141.4,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 270.4,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 883.5,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 270.3,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 971.5,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 103,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 420.5,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 145.4,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1411.5,
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
          "id": "530b52ed5f7aa5d7fa36df5e46071b95293be4f5",
          "message": "Merge pull request #181 from Yuki-bach/claude/review-import-components-26OmO",
          "timestamp": "2026-03-19T22:16:20+09:00",
          "tree_id": "e555c57deaa584eb9471428a9d72e16448681375",
          "url": "https://github.com/Yuki-bach/aggy/commit/530b52ed5f7aa5d7fa36df5e46071b95293be4f5"
        },
        "date": 1773926222477,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 53.7,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 141,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 270.2,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 906.8,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 271.9,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 982.5,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 101.5,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 399.7,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 141.2,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1440.7,
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
          "id": "10cfe8f209cafb51e0beb144120960353c9386cc",
          "message": "Merge pull request #183 from Yuki-bach/viteplus\n\nMigrate toolchain from Vite + Vitest + Oxc to VitePlus",
          "timestamp": "2026-03-21T16:53:46+09:00",
          "tree_id": "69c8a6c7ebbdedad717f2c5e477879d00431c174",
          "url": "https://github.com/Yuki-bach/aggy/commit/10cfe8f209cafb51e0beb144120960353c9386cc"
        },
        "date": 1774079662556,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 55.1,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 136.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 287.7,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 949.8,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 271.3,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 970.2,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 100.1,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 404.5,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 143.3,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1446.4,
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
          "id": "b6712abde4631c093249b11b36f8412bd90a1349",
          "message": "Merge pull request #184 from Yuki-bach/fix/sample-layout-weight-label\n\nfix: add missing label to WEIGHT entry in sample layout",
          "timestamp": "2026-03-21T16:59:53+09:00",
          "tree_id": "888a673ec39f9eb7558d5573878aabb8e7e6cf8a",
          "url": "https://github.com/Yuki-bach/aggy/commit/b6712abde4631c093249b11b36f8412bd90a1349"
        },
        "date": 1774080029309,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 56.3,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 142.1,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 282.1,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 920.7,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 273.5,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 998.7,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 101.1,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 415.7,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 143,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1471.9,
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
          "id": "b7e3b4c2bf9860d4da5aefd67faed13f1eeb4ad5",
          "message": "Merge pull request #185 from Yuki-bach/improve/realistic-sample-data\n\nサンプルデータをリアルな顧客満足度調査に改善",
          "timestamp": "2026-03-21T18:14:01+09:00",
          "tree_id": "225ccc1efb36bcf11e5ae03896b9c6bbcf2da646",
          "url": "https://github.com/Yuki-bach/aggy/commit/b7e3b4c2bf9860d4da5aefd67faed13f1eeb4ad5"
        },
        "date": 1774084476325,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 52.4,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 134.4,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 273.6,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 894.5,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 264.4,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 954.9,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 99.2,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 402.3,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 139.7,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1420.5,
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
          "id": "354e344aa5b1fde886fde0308f7dc45ce852b18f",
          "message": "Merge pull request #182 from Yuki-bach/claude/reduce-useeffect-usage-dUELo\n\nExtract custom hooks to reduce useEffect duplication",
          "timestamp": "2026-03-21T18:30:49+09:00",
          "tree_id": "5623d18cc5cb1f111f932f3bf4ab96bd08f2f20f",
          "url": "https://github.com/Yuki-bach/aggy/commit/354e344aa5b1fde886fde0308f7dc45ce852b18f"
        },
        "date": 1774085485502,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 53.3,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 144.5,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 281.1,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 905.6,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 267.2,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 971.3,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 100.3,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 408.6,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 142.7,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1467.4,
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
          "id": "95135271addee59f2f6684db8ac8915da94f0a9f",
          "message": "Merge pull request #190 from Yuki-bach/claude/pbt-invariants-guide-KRbrg",
          "timestamp": "2026-03-22T05:59:20+09:00",
          "tree_id": "31cf558826fe92ebe05d49862038f3b16288671f",
          "url": "https://github.com/Yuki-bach/aggy/commit/95135271addee59f2f6684db8ac8915da94f0a9f"
        },
        "date": 1774126801321,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 98.6,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 172,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 312.6,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 959.1,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 294.7,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1052.5,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 104.3,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 439.2,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 161.3,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1667.6,
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
          "id": "907318ac6d8f8c46a818ad5ca243d970b31640a9",
          "message": "Merge pull request #192 from Yuki-bach/claude/fix-slice-ordering-rEvft",
          "timestamp": "2026-03-22T09:05:53+09:00",
          "tree_id": "d54941051105b4331ae76bfa07343be6e8f0adb9",
          "url": "https://github.com/Yuki-bach/aggy/commit/907318ac6d8f8c46a818ad5ca243d970b31640a9"
        },
        "date": 1774137993245,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 74.3,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 159.5,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 284.5,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 981.4,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 300,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1002.2,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 104.8,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 421.2,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 144.2,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1526.7,
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
          "id": "c683e06674e5ea8a66ae05d2b7f0a52a8419003f",
          "message": "Merge pull request #193 from Yuki-bach/claude/fix-type-warnings-GBrBt",
          "timestamp": "2026-03-22T11:44:36+09:00",
          "tree_id": "218a6df02ad9eec2f875747b6f91d3d0472ce73b",
          "url": "https://github.com/Yuki-bach/aggy/commit/c683e06674e5ea8a66ae05d2b7f0a52a8419003f"
        },
        "date": 1774147511457,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 54.3,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 138.6,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 275.8,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 906.4,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 273.4,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 981.7,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 100.7,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 414.5,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 142.9,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1420.2,
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
          "id": "244dbb15402d035f2a72d3cbae364150659f4b6f",
          "message": "Merge pull request #194 from Yuki-bach/claude/setup-vite-linter-rules-91SxG",
          "timestamp": "2026-03-22T14:29:30+09:00",
          "tree_id": "d9ea730f110ce06f47e187d3400a6da0866af1a6",
          "url": "https://github.com/Yuki-bach/aggy/commit/244dbb15402d035f2a72d3cbae364150659f4b6f"
        },
        "date": 1774157406000,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 92.3,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 168.9,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 277.7,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 934.3,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 275.7,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 978.8,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 101.1,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 415.1,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 144,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1509,
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
          "id": "a09371c860ca2bb74cc015b333451b35f14b8ad4",
          "message": "Merge pull request #189 from Yuki-bach/claude/evaluate-pandacss-migration-UKxpv\n\nrefactor: extract shared UI components (Button, IconButton, Alert, SectionTitle)",
          "timestamp": "2026-03-22T15:04:21+09:00",
          "tree_id": "37d0b3a4806d430c10b1e0585a474dacfef12ac6",
          "url": "https://github.com/Yuki-bach/aggy/commit/a09371c860ca2bb74cc015b333451b35f14b8ad4"
        },
        "date": 1774159497095,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 52.6,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 140.3,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 274,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 941.4,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 280.6,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 1003.2,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 104.5,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 417.6,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 152.2,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1592.5,
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
          "id": "b3d8d7fa81f2d2cf2ba983c5b08c3a181d7b7dd1",
          "message": "Merge pull request #195 from Yuki-bach/claude/enable-oxlint-a11y-xKJGQ",
          "timestamp": "2026-03-22T16:30:14+09:00",
          "tree_id": "17edb50db6f2a30fc03fdc6f3c10f088a6b58019",
          "url": "https://github.com/Yuki-bach/aggy/commit/b3d8d7fa81f2d2cf2ba983c5b08c3a181d7b7dd1"
        },
        "date": 1774164653247,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 54.4,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 141.2,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 274.5,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 903.1,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 284.5,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 982.6,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 102,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 420.6,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 150.3,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1469,
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
          "id": "8d12057ce214db45879483943c9d75086e6b9a41",
          "message": "Merge pull request #191 from Yuki-bach/claude/sqlite-testing-techniques-4q34J",
          "timestamp": "2026-03-22T16:31:47+09:00",
          "tree_id": "f5251f7a28bb6e19df22b1c89f07d32be024e46e",
          "url": "https://github.com/Yuki-bach/aggy/commit/8d12057ce214db45879483943c9d75086e6b9a41"
        },
        "date": 1774164746028,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 54.2,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 169.5,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 285.9,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 926.7,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 268.9,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 963.3,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 99,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 415.8,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 143.3,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1426.8,
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
          "id": "daaa4a1ed3ccb30687813f7b0f6c879c0cc603db",
          "message": "Merge pull request #196 from Yuki-bach/claude/review-aggna-structure-C6UKS",
          "timestamp": "2026-03-22T18:07:05+09:00",
          "tree_id": "60e87d152f84e9e155600a7d64d33bbeefe94682",
          "url": "https://github.com/Yuki-bach/aggy/commit/daaa4a1ed3ccb30687813f7b0f6c879c0cc603db"
        },
        "date": 1774170462571,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "rows (10000 rows, 62 cols, cross=none)",
            "value": 54.1,
            "unit": "ms"
          },
          {
            "name": "rows (10000 rows, 62 cols, cross=SA×2)",
            "value": 139,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=none)",
            "value": 284.6,
            "unit": "ms"
          },
          {
            "name": "cols (1000 rows, 602 cols, cross=SA×2)",
            "value": 951.7,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=none)",
            "value": 277.1,
            "unit": "ms"
          },
          {
            "name": "both (10000 rows, 602 cols, cross=SA×2)",
            "value": 974.9,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=none)",
            "value": 98.9,
            "unit": "ms"
          },
          {
            "name": "sa-only (10000 rows, 102 cols, cross=SA×2)",
            "value": 407.2,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=none)",
            "value": 160.6,
            "unit": "ms"
          },
          {
            "name": "ma-only (10000 rows, 502 cols, cross=MA×2)",
            "value": 1454.8,
            "unit": "ms"
          }
        ]
      }
    ]
  }
}