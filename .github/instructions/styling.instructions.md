---
applyTo: "/**/*.tsx"
---

# スタイリング規約

## 基本方針

Chrome拡張機能の特性を考慮したハイブリッド戦略を採用します。

### 1. **Tailwind CSS 優先使用**

以下の場合はTailwind CSSを使用：

- **静的なレイアウト**: `flex`, `grid`, `padding`, `margin`
- **基本色**: `bg-blue-500`, `text-gray-700`
- **基本サイズ**: `w-full`, `h-screen`, `text-lg`
- **基本状態**: `hover:`, `focus:`, `disabled:`
- **レスポンシブ**: `md:`, `lg:`

```tsx
// 推奨例
<button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-300">
  送信
</button>
```

### 2. **インラインスタイル使用ケース**

以下の場合のみインラインスタイルを使用：

- **動的な値**: JavaScript変数に基づく値
- **複雑なアニメーション**: CSSアニメーションでは困難な処理
- **Chrome拡張特有の制約**: CSP制約やShadow DOM対応
- **精密な位置制御**: ピクセル単位の調整が必要

```tsx
// 許可される例
<div
  style={{
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: `scale(${zoomLevel})`
  }}
  className="fixed bg-white rounded-lg shadow-lg">
  動的要素
</div>
```

### 3. **禁止事項**

- **静的値のインラインスタイル**: `style={{color: '#3b82f6'}}` → `className="text-blue-500"`
- **長大なインラインスタイル**: 5つ以上のプロパティは分割検討
- **Tailwindで表現可能なスタイル**: 既存クラスがある場合は使用禁止

### 4. **定数活用**

マジックナンバーは`constants/index.ts`で定義：

```tsx
// 推奨
import { PANEL_SIZE, STYLES } from "../constants"

<div style={{
  width: `${PANEL_SIZE.MIN_WIDTH}px`,
  zIndex: STYLES.Z_INDEX.MODAL
}}>
```

### 5. **コンポーネント内カスタムCSS**

複雑なスタイルは`styles/style.css`で定義し、Tailwindクラスとして使用：

```css
/* styles/style.css */
@layer components {
  .custom-scrollbar {
    @apply scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent;
  }
}
```

## 実装優先度

1. **最優先**: Tailwind CSSクラス
2. **次点**: 定数を使用したインラインスタイル
3. **最後の手段**: 直接値のインラインスタイル

## レビュー観点

- インラインスタイルの使用理由が明確か
- Tailwindで代替可能なスタイルがないか
- 定数が適切に使用されているか
- コードの可読性が保たれているか
