# 本プロジェクト固有の調査リファレンス

## よくある不具合の原因パターン

| カテゴリ | よくある原因 | 調査対象 |
|---------|-------------|---------|
| Gemini API 連携 | APIキー不正、権限不足、429 Quota、JSON形式崩れ | `src/lib/geminiSplitter.ts`, `src/components/ApiKeyModal.tsx`, `src/App.tsx` |
| 座標処理 | 0-1000 と 0-1 の混在、`box_2d` 順序ミス、最小サイズ未満 | `src/lib/geminiSplitter.ts`, `src/components/RectangleEditor.tsx`, `src/components/RectangleControls.tsx` |
| 切り抜き処理 | `createImageBitmap` 失敗、Canvas `toBlob` 失敗、ObjectURL管理不備 | `src/lib/imageProcessor.ts`, `src/components/ResultGallery.tsx`, `src/App.tsx` |
| 状態遷移 | フェーズ遷移の不整合（解析中/編集中/結果表示） | `src/App.tsx` |
| 保存/読込 | IndexedDB 追加失敗、履歴データ形式不一致 | `src/lib/db.ts` |
| モバイル表示 | 端末判定ミス、`resize`/`orientationchange` 後の表示崩れ | `src/hooks/useMobile.ts`, `src/lib/deviceDetection.ts`, `src/components/layouts/` |
| 入力UI | D&D/ファイル選択の境界ケース（非画像、連打、途中キャンセル） | `src/components/ImageUploader.tsx`, `src/App.tsx` |

## 深刻度の判断基準

| 深刻度 | 基準 |
|--------|------|
| 🔴 Critical | アプリ利用不能、画像処理不能、データ破損、機密情報漏えい |
| 🟠 Major | 主機能（解析・編集・切り抜き・保存）のいずれかが実用不能 |
| 🟡 Minor | UI崩れ、軽微な操作性低下、回避可能なエッジケース |

## 調査時の優先チェック

1. **再現手順の固定**: 同じ画像・同じモデル・同じ操作順で再現するか
2. **エラー可視化**: UIエラー表示とコンソールログの一致を確認
3. **API応答確認**: Networkで HTTP ステータスとレスポンス本文を確認
4. **データ整合性**: `box_2d` の範囲・順序・件数を確認
5. **副作用確認**: 再解析、再編集、リセット後に状態が残留しないか確認

## 初動切り分けの順序

1. `src/App.tsx` で状態遷移とエラーハンドリングを確認
2. `src/lib/geminiSplitter.ts` で API応答/JSON/座標変換を確認
3. `src/lib/imageProcessor.ts` で Canvas/Blob/ObjectURL の処理を確認
4. `src/lib/db.ts` で保存処理の失敗有無を確認
5. モバイル固有事象の場合は `src/hooks/useMobile.ts` と `src/lib/deviceDetection.ts` を確認

## 補足

- このリポジトリには専用ログストアは無く、基本は UI エラー表示とブラウザ開発者ツールで調査する。
- 修正実装に進む場合は `bugfix-guard` を使用し、影響範囲確認とデグレ防止チェックを実施する。
