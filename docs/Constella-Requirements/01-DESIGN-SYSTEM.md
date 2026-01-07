# Constella デザインシステム v1.0

## カラーパレット

### Primary Colors
```css
--constella-white: #FFFFFF;
--constella-black: #000000;
--constella-dark: #0A0A0A;
```

### Gray Scale
```css
--constella-gray-50: #FAFAFA;
--constella-gray-100: #F5F5F5;
--constella-gray-200: #E5E5E5;
--constella-gray-300: #D4D4D4;
--constella-gray-400: #A3A3A3;
--constella-gray-500: #737373;
--constella-gray-600: #525252;
--constella-gray-700: #404040;
--constella-gray-800: #262626;
--constella-gray-900: #171717;
```

### Accent Colors (星の輝き)
```css
--constella-star-glow: rgba(255, 255, 255, 0.8);
--constella-star-gold: #F5DEB3;
--constella-star-silver: #C0C0C0;
--constella-constellation-line: rgba(255, 255, 255, 0.3);
```

### Semantic Colors
```css
--constella-success: #10B981;
--constella-warning: #F59E0B;
--constella-error: #EF4444;
--constella-info: #3B82F6;
```

---

## Typography

### Font Family
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-display: 'Space Grotesk', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Font Sizes
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
```

### Font Weights
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## Spacing

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

---

## Border Radius

```css
--radius-none: 0;
--radius-sm: 0.125rem;   /* 2px */
--radius-md: 0.375rem;   /* 6px */
--radius-lg: 0.5rem;     /* 8px */
--radius-xl: 0.75rem;    /* 12px */
--radius-2xl: 1rem;      /* 16px */
--radius-full: 9999px;
```

---

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

/* 星の輝き効果 */
--shadow-star: 0 0 20px rgba(255, 255, 255, 0.5);
--shadow-star-glow: 0 0 40px rgba(255, 255, 255, 0.3);
```

---

## Animation

### Timing Functions
```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-star: cubic-bezier(0.25, 0.1, 0.25, 1);
```

### Durations
```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-slower: 700ms;
```

### Star Animations
```css
@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.5); }
  50% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.8); }
}
```

---

## Components

### Stella Icon (星アイコン)
```tsx
// 基本的な星アイコン
<Star className="w-4 h-4 text-constella-black" />

// 輝く星（アクティブ状態）
<Star className="w-4 h-4 text-constella-black fill-current animate-twinkle" />

// 繋がった星（コンステレーション）
<div className="flex items-center gap-1">
  <Star className="w-3 h-3" />
  <div className="w-8 h-px bg-constella-gray-300" />
  <Star className="w-3 h-3" />
</div>
```

### Button Variants
```tsx
// Primary (黒背景)
<Button className="bg-black text-white hover:bg-gray-800" />

// Secondary (白背景・黒ボーダー)
<Button className="bg-white text-black border border-black hover:bg-gray-50" />

// Ghost (透明)
<Button className="bg-transparent text-black hover:bg-gray-100" />
```

### Card
```tsx
<Card className="bg-white border border-gray-200 rounded-xl shadow-sm" />
```

### Input
```tsx
<Input className="bg-white border border-gray-300 rounded-lg focus:border-black focus:ring-1 focus:ring-black" />
```

---

## Layout Principles

### 余白の活用
- 広い余白で「宇宙空間」を表現
- コンテンツ間は最低 `space-6` 以上
- ページ端からは `space-8` 以上のマージン

### グリッド
- 12カラムグリッドを基本
- モバイル: 1-2カラム
- タブレット: 2-3カラム
- デスクトップ: 3-4カラム

### コンテンツの配置
- 中央寄せを基本
- 左寄せは読み物コンテンツのみ
- 星座のような自然な配置も許容

---

## アイコン指針

### Stella関連
- ★ 塗りつぶし星 = アクティブなステラ
- ☆ 白抜き星 = 非アクティブなステラ
- 線で繋がった星 = コンステレーション

### その他アイコン
- Lucide Icons を基本使用
- 線幅: 1.5-2px
- 角丸: あり

---

## 最終更新
2026年1月8日
