# AI Image Splitter (AI シーン切り抜きツール)

**AI Image Splitter**は、Google Gemini 2.5 AIを活用して、コマ割りされた画像やグリッド状の画像を自動的に分析し、個別の画像に切り抜くことができるWebアプリケーションです。

プライバシー重視の「ローカルファースト」設計により、画像データはサーバーに保存されず、ブラウザ上で安全に処理されます。

![App Screenshot](public/favicon.png)

## ✨ 主な機能

*   **⚡ 高速なAI分析**: **Google Gemini 2.5 Flash** モデルを使用し、画像の構造を瞬時に理解します。
*   **🖼️ 自動切り抜き**: 漫画のコマ、グリッド画像、スプライトシートなどを自動検出し、個別に切り抜きます。
*   **🔒 プライバシー保護**: アップロードされた画像はGemini APIに送信されますが、開発者のサーバーには一切保存されません。処理はすべてブラウザ（クライアントサイド）で完結します。
*   **📱 PWA対応**: スマホやPCにアプリとしてインストール可能。オフラインでも動作します（初回読み込み後）。
*   **💾 便利な保存機能**: 切り抜いた画像は個別に保存したり、まとめてダウンロードしたりできます。
*   **🎨 モダンなUI**: ダークモードを基調とした、目に優しく使いやすいインターフェース。

## 🚀 使い方

1.  **APIキーの設定**:
    *   画面右上の設定アイコン（⚙️）をクリックします。
    *   Google AI Studioで取得したAPIキーを入力します。
    *   *推奨*: モデルはデフォルトの `Gemini 2.5 Flash Lite` のままでOKです。

2.  **画像のアップロード**:
    *   トップ画面に画像をドラッグ＆ドロップするか、クリックしてファイルを選択します。

3.  **分析と確認**:
    *   AIが自動的に画像を分析し、切り抜き範囲（緑色の枠）を表示します。
    *   右側に切り抜かれた個別の画像が一覧表示されます。

4.  **ダウンロード**:
    *   「Save」ボタンで個別に保存するか、「Download All」で一括ダウンロードします。

## 🛠️ 技術スタック

*   **Frontend**: React 19, TypeScript, Vite
*   **AI**: Google Gemini API via `@google/genai` SDK
*   **Styling**: Tailwind CSS v4
*   **Deployment**: GitHub Pages (GitHub Actions)
*   **PWA**: `vite-plugin-pwa`

## 💻 開発者向けセットアップ

ローカル環境で開発を行う場合の手順です。

```bash
# リポジトリのクローン
git clone https://github.com/your-username/satto-crop-anti.git
cd satto-crop-anti

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 📄 ライセンス

MIT License
