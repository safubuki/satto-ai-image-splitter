# スマートフォン向けレスポンシブデザイン ガイドライン

このドキュメントは、本リポジトリ（satto-ai-image-splitter）で実装されているスマートフォン向けレスポンシブデザインのパターンを抽出・整理したものです。別のアプリケーションに同様のレスポンシブデザインを適用する際の参考資料として使用できます。

---

## 1. デバイス検出の基本方針

### 1.1 viewport設定（必須）

HTMLの`<head>`内に以下のviewportメタタグを必ず含めてください：

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

### 1.2 ブレークポイント定義

本アプリでは以下のブレークポイントを使用しています：

| デバイス | 画面幅 | Tailwind接頭辞 |
|---------|--------|----------------|
| スマートフォン | ~640px | デフォルト（接頭辞なし） |
| タブレット/小画面 | 640px~ | `sm:` |
| タブレット/中画面 | 768px~ | `md:` |
| デスクトップ | 1024px~ | `lg:` |

### 1.3 JavaScriptによるデバイス検出（重要）

CSSのメディアクエリだけでなく、**JavaScriptによるデバイス検出**を併用することで、より正確なスマートフォン判定が可能になります。

本リポジトリでは `src/lib/deviceDetection.ts` に以下の検出関数を実装しています：

#### タッチデバイス検出 `isTouchDevice()`

```typescript
// User agent patterns for mobile device detection
const MOBILE_USER_AGENT_PATTERN = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

/**
 * Detect if the device supports touch input
 * This checks multiple indicators beyond just screen size
 */
export function isTouchDevice(): boolean {
  // Check if running in a browser environment
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for touch events support
  if ('ontouchstart' in window) {
    return true;
  }

  // Check for pointer with coarse accuracy (typically touch)
  if (window.matchMedia('(pointer: coarse)').matches) {
    return true;
  }

  // Check for hover capability (touch devices typically don't have hover)
  if (window.matchMedia('(hover: none)').matches) {
    return true;
  }

  // Check navigator maxTouchPoints
  if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) {
    return true;
  }

  return false;
}
```

**検出方法（優先順）：**
1. `'ontouchstart' in window` - タッチイベントのサポート
2. `window.matchMedia('(pointer: coarse)')` - 粗い精度のポインター（タッチ）
3. `window.matchMedia('(hover: none)')` - ホバー機能なし（タッチデバイス）
4. `navigator.maxTouchPoints > 0` - タッチポイント数

#### モバイルデバイス検出 `isMobileDevice()`

```typescript
/**
 * Detect if the device is likely a mobile phone based on multiple factors
 */
export function isMobileDevice(): boolean {
  // Check if running in a browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // User agent check with safe property access
  const userAgent = (navigator.userAgent || navigator.vendor || '').toLowerCase();
  
  // Check for mobile user agents
  const isMobileUA = MOBILE_USER_AGENT_PATTERN.test(userAgent);
  
  // Combine touch detection with screen size
  const isSmallScreen = window.innerWidth < 768;
  const hasTouch = isTouchDevice();
  
  return isMobileUA || (isSmallScreen && hasTouch);
}
```

**スマホ判定ロジック：**
- **ユーザーエージェント**にモバイル文字列が含まれる → スマホ
  - 対象: `android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini`
  - 注: `ipad`はUser-Agent判定でスマホ扱いになりますが、`getDeviceType()`では画面幅とタッチ対応で`tablet`に分類されます
  - 注: `iemobile`はInternet Explorer Mobile、`opera mini`はOpera Miniブラウザを指します
- または **画面幅768px未満** かつ **タッチ対応** → スマホ

#### デバイスタイプ分類 `getDeviceType()`

```typescript
/**
 * Get device type classification
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  // Check if running in a browser environment
  if (typeof window === 'undefined') {
    return 'desktop';
  }

  const width = window.innerWidth;
  const hasTouch = isTouchDevice();
  
  if (width < 768 && hasTouch) {
    return 'mobile';
  } else if (width >= 768 && width < 1024 && hasTouch) {
    return 'tablet';
  }
  
  return 'desktop';
}
```

**分類基準：**
| デバイスタイプ | 条件 |
|---------------|------|
| mobile | 幅 < 768px かつ タッチ対応 |
| tablet | 768px ≤ 幅 < 1024px かつ タッチ対応 |
| desktop | それ以外 |

### 1.4 SSR（サーバーサイドレンダリング）対応

SSR環境では`window`や`navigator`が存在しないため、必ず存在チェックを行います：

```typescript
if (typeof window === 'undefined' || typeof navigator === 'undefined') {
  return false; // または安全側としてtrue（スマホ扱い）
}
```

---

## 2. レスポンシブデザインのパターン

### 2.1 モバイルファースト設計

Tailwind CSSのモバイルファースト設計に従い、**デフォルトでモバイル向けスタイルを定義し、大きな画面ではブレークポイント接頭辞で上書き**します。

#### 実装例：ヘッダー

```tsx
<header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-40">
  <div className="container mx-auto px-4 h-auto py-4 sm:py-0 sm:h-20 flex items-center justify-between gap-3">
    {/* コンテンツ */}
  </div>
</header>
```

**ポイント：**
- デフォルト（モバイル）: `py-4`（パディングで高さを調整）
- `sm:`以上（タブレット〜）: `sm:py-0 sm:h-20`（固定高さ）

### 2.2 アイコン・ボタンサイズの調整

スマホでは**タッチ操作に適した大きめのサイズ**、PCでは**コンパクトなサイズ**を使用します。

#### 実装例：設定ボタン

```tsx
<button className="p-3 sm:p-2 hover:bg-gray-800 rounded-xl sm:rounded-lg transition-colors">
  <Settings className="w-8 h-8 sm:w-6 sm:h-6" />
</button>
```

**スマホ向け（デフォルト）:**
- パディング: `p-3`（24px相当）
- 角丸: `rounded-xl`（大きめ）
- アイコンサイズ: `w-8 h-8`（32px）

**タブレット〜PC向け（sm:以上）:**
- パディング: `sm:p-2`（8px相当）
- 角丸: `sm:rounded-lg`（小さめ）
- アイコンサイズ: `sm:w-6 sm:h-6`（24px）

### 2.3 テキストサイズの段階的調整

デバイスサイズに応じて、読みやすさを維持しながらテキストサイズを調整します。

#### 実装例：見出しテキスト

```tsx
<h1 className="text-xl sm:text-xl font-bold text-white tracking-wide">
  サッとAIイメージ分割
</h1>
<p className="text-[11px] sm:text-[11px] text-gray-400 hidden sm:block">
  画像や漫画のコマをAIで自動検出
</p>
```

**モバイルのみ非表示にするコンテンツ:**

```tsx
<span className="hidden sm:inline">、またはドラッグ＆ドロップ</span>
```

PCでのみ「ドラッグ＆ドロップ」の案内を表示し、スマホでは省略（タップのみ案内）。

---

## 3. コンポーネント別パターン集

### 3.1 画像アップロードエリア

```tsx
<div className="relative w-full min-h-[60vh] sm:min-h-0 sm:aspect-video max-w-2xl mx-auto rounded-2xl border-2 border-dashed">
  {/* コンテンツ */}
</div>
```

**スマホ向け（デフォルト）:**
- `min-h-[60vh]`: 画面高さの60%を最小高さとして確保（タップしやすい大きなエリア）

**タブレット〜PC向け（sm:以上）:**
- `sm:min-h-0 sm:aspect-video`: 高さ制限を解除し、16:9のアスペクト比を適用

### 3.2 モーダルダイアログ

```tsx
<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
  <div className="w-full sm:max-w-lg bg-gray-900 border border-gray-800 rounded-t-2xl sm:rounded-xl shadow-2xl max-h-[90vh] sm:max-h-[95vh] overflow-y-auto">
    {/* モーダルコンテンツ */}
  </div>
</div>
```

**スマホ向け（デフォルト）:**
- `items-end`: モーダルを画面下から表示（ボトムシート風）
- `p-0`: 外側のパディングなし
- `rounded-t-2xl`: 上部のみ角丸
- `max-h-[90vh]`: 画面高さの90%まで

**タブレット〜PC向け（sm:以上）:**
- `sm:items-center`: モーダルを画面中央に配置
- `sm:p-4`: 外側に適切なパディング
- `sm:max-w-lg`: 最大幅を制限
- `sm:rounded-xl`: 四隅すべて角丸

### 3.3 フォーム入力フィールド

```tsx
<input
  type="password"
  className="w-full bg-gray-950 border border-gray-800 rounded-xl sm:rounded-lg px-4 py-4 sm:px-4 sm:py-3 md:px-6 md:py-5 text-white font-mono text-base sm:text-base md:text-lg"
/>
```

**スマホ向け（デフォルト）:**
- パディング: `px-4 py-4`（大きめのタップ領域）
- 角丸: `rounded-xl`

**タブレット向け（sm:）:**
- パディング: `sm:py-3`（やや小さく）
- 角丸: `sm:rounded-lg`

### 3.4 グリッドレイアウト

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
  {/* 左カラム */}
  <div className="space-y-4 sm:space-y-4">...</div>
  {/* 右カラム */}
  <div className="space-y-4 sm:space-y-4">...</div>
</div>
```

**スマホ向け（デフォルト）:**
- `grid-cols-1`: 1カラム縦並び

**デスクトップ向け（lg:）:**
- `lg:grid-cols-2`: 2カラム横並び

### 3.5 結果ギャラリー（2カラムグリッド）

```tsx
<div className="grid grid-cols-2 gap-4 sm:gap-4 md:gap-6">
  {results.map((crop) => (
    <div className="group relative bg-gray-800 rounded-2xl sm:rounded-lg overflow-hidden border border-gray-700">
      {/* カード内容 */}
    </div>
  ))}
</div>
```

---

## 4. ボタン・インタラクティブ要素のサイズガイドライン

### 4.1 タッチ対応の最小サイズ

スマホでの操作性を確保するため、**タップ領域は最低44px×44px**を推奨します。

```tsx
// スマホ向けの大きなボタン
<button className="px-8 py-3.5 sm:px-10 sm:py-4 text-base sm:text-lg font-bold">
  アクション
</button>
```

### 4.2 アクティブ状態のフィードバック

タッチデバイスでの操作フィードバックとして`active:`状態を定義します：

```tsx
<button className="hover:bg-gray-800 active:bg-gray-700 active:scale-95 transition-all">
  タップ可能
</button>
```

---

## 5. スペーシング・余白のガイドライン

### 5.1 コンテナの余白

```tsx
<div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
  {/* メインコンテンツ */}
</div>
```

- 左右パディング: `px-4`（16px）で固定
- 上下パディング: スマホ`py-6`（24px）、タブレット〜`sm:py-8`（32px）

### 5.2 コンポーネント間のスペース

```tsx
<div className="space-y-6 sm:space-y-8">
  {/* 複数のセクション */}
</div>
```

- スマホ: `space-y-6`（24px）
- タブレット〜: `sm:space-y-8`（32px）

---

## 6. 条件付きコンテンツ表示

### 6.1 デバイス別の表示/非表示

```tsx
{/* PCでのみ表示 */}
<p className="hidden sm:block">デスクトップ向けの説明文</p>

{/* スマホでのみ表示 */}
<br className="sm:hidden" />

{/* インライン要素の場合 */}
<span className="hidden sm:inline">（補足テキスト）</span>
```

### 6.2 デバイス別のテキスト内容

```tsx
<p className="text-base text-gray-400">
  タップして画像を選択
  <span className="hidden sm:inline">、またはドラッグ＆ドロップ</span>
</p>
```

---

## 7. 別アプリへの適用手順

他のReact/Tailwind CSSアプリケーションに同様のレスポンシブデザインを適用する際は、以下の手順で実装してください：

### Step 1: viewport設定の確認

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

### Step 2: デバイス検出ユーティリティの追加

`src/lib/deviceDetection.ts` を作成し、上記のデバイス検出関数を実装します。

### Step 3: Tailwind CSSのモバイルファースト設計を徹底

- デフォルトでモバイル向けスタイルを記述
- `sm:`、`md:`、`lg:`で順に大画面向けスタイルを上書き

### Step 4: タッチ操作の最適化

- ボタン・タップ領域は最低44px×44px
- `active:`状態でタップフィードバックを提供
- スマホでは角丸を大きめに（`rounded-xl`）、PCでは小さめに（`rounded-lg`）

### Step 5: モーダル・オーバーレイのモバイル対応

- スマホではボトムシート風表示（`items-end`）
- PCでは中央表示（`sm:items-center`）

### Step 6: コンテンツの適切な省略

- 長い説明文はスマホで非表示（`hidden sm:block`）
- 操作方法はデバイスに応じた案内（タップ vs ドラッグ＆ドロップ）

---

## 8. コピペ用指示文（別アプリに渡す用）

以下のテキストをそのまま別アプリケーション（別チーム/別AI/別実装者）に渡すと、このリポジトリと同等のレスポンシブデザインを実装できます。

---

### 【スマホ向けレスポンシブ実装指示】

#### 前提条件
- React + Tailwind CSS を使用していること
- TypeScript を使用していること（推奨）

#### 1. viewportの設定（必須）

HTMLの`<head>`に以下を追加：

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

#### 2. JavaScriptによるスマホ判定の実装（重要）

**なぜCSSだけでは不十分か：**
- CSSメディアクエリは画面幅のみで判定
- タッチ対応やUser-Agentを考慮できない
- 動的にUIを切り替えるロジックが書けない

**`src/lib/deviceDetection.ts`を作成：**

```typescript
const MOBILE_USER_AGENT_PATTERN = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  if ('ontouchstart' in window) return true;
  if (window.matchMedia('(pointer: coarse)').matches) return true;
  if (window.matchMedia('(hover: none)').matches) return true;
  if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return true;
  return false;
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const userAgent = (navigator.userAgent || '').toLowerCase();
  const isMobileUA = MOBILE_USER_AGENT_PATTERN.test(userAgent);
  const isSmallScreen = window.innerWidth < 768;
  const hasTouch = isTouchDevice();
  return isMobileUA || (isSmallScreen && hasTouch);
}

export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  const hasTouch = isTouchDevice();
  if (width < 768 && hasTouch) return 'mobile';
  if (width >= 768 && width < 1024 && hasTouch) return 'tablet';
  return 'desktop';
}
```

#### 3. Tailwind CSSのモバイルファースト設計

**原則：**
- デフォルト（接頭辞なし）= スマホ向け
- `sm:` = 640px以上
- `md:` = 768px以上
- `lg:` = 1024px以上

**例：ボタンサイズ**
```tsx
<button className="p-3 sm:p-2 rounded-xl sm:rounded-lg">
  <Icon className="w-8 h-8 sm:w-6 sm:h-6" />
</button>
```

#### 4. スマホ向けサイズ・余白の基準

| 項目 | スマホ | PC |
|-----|-------|-----|
| ボタンパディング | `p-3`〜`p-4` | `sm:p-2` |
| 角丸 | `rounded-xl`〜`rounded-2xl` | `sm:rounded-lg` |
| アイコンサイズ | `w-8 h-8` | `sm:w-6 sm:h-6` |
| タップ領域最小サイズ | 44px × 44px | 制限なし |
| コンテナ横パディング | `px-4` | `px-4` |
| セクション間スペース | `space-y-6` | `sm:space-y-8` |

#### 5. モーダルのスマホ対応

```tsx
<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
  <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl max-h-[90vh] overflow-y-auto">
    {/* 内容 */}
  </div>
</div>
```

**ポイント：**
- スマホ: `items-end`（画面下部から表示）、`rounded-t-2xl`（上部のみ角丸）
- PC: `sm:items-center`（中央表示）、`sm:rounded-xl`（四隅角丸）

#### 6. タッチフィードバック

```tsx
<button className="hover:bg-gray-800 active:bg-gray-700 active:scale-95 transition-all">
  タップ可能
</button>
```

#### 7. デバイス別コンテンツの出し分け

```tsx
{/* PCのみ表示 */}
<span className="hidden sm:inline">ドラッグ＆ドロップで追加</span>

{/* スマホのみ表示 */}
<span className="sm:hidden">タップで追加</span>
```

#### 8. グリッドレイアウト

```tsx
{/* スマホ1カラム → PC2カラム */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
  <div>左カラム</div>
  <div>右カラム</div>
</div>
```

---

## 9. チェックリスト

新規アプリまたは既存アプリにレスポンシブデザインを適用する際のチェックリスト：

- [ ] viewportメタタグが設定されている
- [ ] モバイルファースト設計になっている（デフォルトがモバイル向け）
- [ ] ボタン・タップ領域が最低44px×44px
- [ ] active:状態でタップフィードバックがある
- [ ] モーダルがスマホではボトムシート風に表示される
- [ ] 長いテキストがスマホで適切に省略/非表示になっている
- [ ] グリッドがスマホでは1カラム、PCでは複数カラムに対応
- [ ] フォント・アイコンサイズがデバイスに応じて調整されている

---

## 10. 参考：本リポジトリで使用されているTailwindクラス一覧

### ブレークポイント別クラス使用例

| 目的 | スマホ (デフォルト) | sm: (640px+) | md: (768px+) | lg: (1024px+) |
|-----|---------------------|--------------|--------------|---------------|
| ボタンパディング | `p-3` | `sm:p-2` | - | - |
| アイコンサイズ | `w-8 h-8` | `sm:w-6 sm:h-6` | - | - |
| 角丸 | `rounded-xl` | `sm:rounded-lg` | - | - |
| グリッドカラム | `grid-cols-1` | - | - | `lg:grid-cols-2` |
| ヘッダー高さ | `py-4` | `sm:h-20 sm:py-0` | - | - |
| モーダル位置 | `items-end` | `sm:items-center` | - | - |
| 最小高さ | `min-h-[60vh]` | `sm:min-h-0 sm:aspect-video` | - | - |
| フォーム入力 | `py-4` | `sm:py-3` | `md:py-5` | - |
| テキストサイズ | `text-base` | `sm:text-base` | `md:text-lg` | - |

**備考：**
- `-` はそのブレークポイントでの明示的な指定がないことを示します
- 本リポジトリでは主に `sm:`（640px以上）と `lg:`（1024px以上）を使用しています
- `md:`（768px以上）はフォームやテキストの細かい調整に使用されています

---

*このガイドラインは satto-ai-image-splitter リポジトリの実装に基づいています。*
