---
name: bug-analysis
description: 不具合の現象整理・再現確認・原因切り分け・報告書作成を行う調査特化スキル。修正実装前に問題を構造化し、優先度と対応方針を明確化する。「バグを調査して」「原因を調べて」「エラーを分析」「動かない」「おかしい」「クラッシュ」「troubleshoot」「debug」「error analysis」などで発火。
---

# Bug Analysis Skill

## スキル読み込み通知

このスキルが読み込まれたら、必ず以下の通知をユーザーに表示してください：

> 💡 **Bug Analysis スキルを読み込みました**  
> 不具合の体系的な調査と報告を行います（修正実装は含みません）。

## When to Use

- アプリケーションで不具合が発生したとき
- エラー原因を切り分けたいとき
- 修正前に現象を構造化して整理したいとき
- 複数の問題が同時発生していて優先度付けが必要なとき
- バグレポートや調査報告書を作成したいとき

## 解析手順

### Step 1: 現象の確認

まず以下を収集する：

1. **発生事象**: 何が起きたか（期待値との差分）
2. **再現手順**: どの操作で再現するか
3. **再現率**: 常時 / 高確率 / 低確率 / 不定
4. **影響範囲**: どの機能・画面に影響するか
5. **実行環境**: ブラウザ / OS / 端末 / 画面サイズ

> 💡 報告が曖昧な場合は、まず再現手順を固定し、同一画像・同一APIキー状態で再実行して差分を確認する。

### Step 2: 証跡の収集

このプロジェクトでは以下を優先して確認する：

- UIエラー表示（`ErrorDisplay`）
- ブラウザコンソール（`console.error` 出力）
- Network タブの Gemini API 応答（401/403/429/5xx）
- `localStorage` の設定値（`gemini_api_key`, `gemini_model`）
- 画像の入出力状態（アップロード画像、解析結果、切り抜き結果）

### Step 3: 原因の切り分け

以下の観点で仮説を立て、コードを確認する：

1. **状態遷移**: `upload -> preview -> analyzing -> editing -> cropping -> results` が崩れていないか（`src/App.tsx`）
2. **AI応答処理**: JSON解析、座標正規化（0-1000 -> 0-1）、バリデーション（`src/lib/geminiSplitter.ts`）
3. **切り抜き処理**: `createImageBitmap` / Canvas / `toBlob` / ObjectURL（`src/lib/imageProcessor.ts`）
4. **保存処理**: IndexedDB への履歴保存（`src/lib/db.ts`）
5. **モバイル判定**: `useMobile` と `deviceDetection` の判定・イベント処理（`src/hooks/useMobile.ts`, `src/lib/deviceDetection.ts`）

### Step 4: レポート作成

調査結果は以下テンプレートを使って構造化する：

📄 **[assets/report-template.md](assets/report-template.md)**

### Step 5: 修正フェーズへの引き渡し

このスキルは調査専用。修正実装が必要な場合は、影響範囲・リスク・推奨修正案を明記して `bugfix-guard` に引き継ぐ。

## 本プロジェクト固有の調査リファレンス

📄 **[references/investigation-guide.md](references/investigation-guide.md)**

- よくある原因パターン
- 深刻度判断基準
- 調査時チェックポイント
- 初動切り分けの優先順
