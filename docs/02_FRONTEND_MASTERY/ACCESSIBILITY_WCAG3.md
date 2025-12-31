# アクセシビリティ完全実装ガイド - WCAG 3.0準拠

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: WCAG 3.0 (Silver) 準拠

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [WCAG 3.0ガイドライン](#2-wcag-30ガイドライン)
3. [実装パターン](#3-実装パターン)
4. [実装例](#4-実装例)
5. [テスト方法](#5-テスト方法)

---

## 1. エグゼクティブサマリー

### 1.1 アクセシビリティ目標

- **WCAG 3.0 Level AA準拠**: 最低基準
- **キーボード操作**: すべての機能がキーボードで操作可能
- **スクリーンリーダー対応**: ARIA属性の適切な使用
- **色のコントラスト**: 4.5:1以上のコントラスト比
- **フォーカス管理**: 明確なフォーカスインジケーター

### 1.2 Actoryでの実装方針

- **Radix UI**: アクセシブルなUIコンポーネントライブラリを使用
- **Semantic HTML**: 適切なHTML要素の使用
- **ARIA属性**: 必要に応じてARIA属性を追加
- **キーボードナビゲーション**: Tab、Enter、Escキーのサポート

---

## 2. WCAG 3.0ガイドライン

### 2.1 パフォーマンス基準

1. **知覚可能**: 情報とUIコンポーネントは利用者が知覚できる方法で提示
2. **操作可能**: UIコンポーネントとナビゲーションは操作可能
3. **理解可能**: 情報とUI操作は理解可能
4. **堅牢性**: コンテンツは支援技術を含む様々なユーザーエージェントで解釈可能

---

## 3. 実装パターン

### 3.1 キーボードナビゲーション

```typescript
// ✅ キーボード操作をサポート
'use client';

import { useEffect, useRef } from 'react';

export function KeyboardNavigableList({ items }: { items: Item[] }) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        // フォーカス移動ロジック
      }
    };

    listRef.current?.addEventListener('keydown', handleKeyDown);
    return () => {
      listRef.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <ul ref={listRef} role="listbox">
      {items.map((item) => (
        <li key={item.id} role="option" tabIndex={0}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```

### 3.2 ARIA属性

```typescript
// ✅ ARIA属性を適切に使用
export function Modal({ isOpen, onClose, children }: ModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <h2 id="modal-title">モーダルタイトル</h2>
      <p id="modal-description">モーダルの説明</p>
      {children}
      <button onClick={onClose} aria-label="閉じる">
        ×
      </button>
    </div>
  );
}
```

---

## 4. 実装例

### 4.1 アクセシブルなフォーム

```typescript
// ✅ ラベルとエラーメッセージを適切に紐付け
export function AccessibleForm() {
  return (
    <form>
      <div>
        <label htmlFor="project-name">プロジェクト名</label>
        <input
          id="project-name"
          name="name"
          required
          aria-describedby="name-error"
          aria-invalid={hasError}
        />
        {hasError && (
          <span id="name-error" role="alert">
            プロジェクト名は必須です
          </span>
        )}
      </div>
    </form>
  );
}
```

### 4.2 スキップリンク

```typescript
// ✅ スキップリンクを実装
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white"
    >
      メインコンテンツにスキップ
    </a>
  );
}
```

---

## 5. テスト方法

### 5.1 自動テスト

```typescript
// __tests__/accessibility.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ProjectCard } from '@/components/project/project-card';

expect.extend(toHaveNoViolations);

test('ProjectCard should not have accessibility violations', async () => {
  const { container } = render(<ProjectCard project={mockProject} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## 🌐 必須参照リソース

1. [WCAG 3.0 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
2. [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
3. [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
4. [axe DevTools](https://www.deque.com/axe/devtools/)

---

**推定実装時間**: 1-2週間（アクセシビリティ実装）

