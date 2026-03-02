# AI 分析コメント（Chrome Built-in AI）

集計実行後、Chrome の組み込み AI（Gemini Nano）が結果の傾向を自動で要約し、画面右下に吹き出しで表示します。非対応ブラウザでは自動的に非表示になります。

## 有効化手順（Chrome 138+）

1. `chrome://flags/#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**
2. `chrome://flags/#prompt-api-for-gemini-nano` → **Enabled**
3. Chrome を再起動
4. `chrome://components` → **Optimization Guide On Device Model** の「アップデートを確認」でモデルをダウンロード
