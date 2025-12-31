# フロントエンドパフォーマンス最適化完全ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: Next.js 14 + React 18

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [パフォーマンス指標](#2-パフォーマンス指標)
3. [最適化手法](#3-最適化手法)
4. [実装例](#4-実装例)
5. [測定とモニタリング](#5-測定とモニタリング)

---

## 1. エグゼクティブサマリー

### 1.1 パフォーマンス目標

- **LCP (Largest Contentful Paint)**: < 2.5秒
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTI (Time to Interactive)**: < 3.5秒
- **バンドルサイズ**: 初期ロード < 200KB (gzip)

### 1.2 最適化戦略

1. **コード分割**: 動的インポートによる遅延ローディング
2. **画像最適化**: Next.js Image、WebP/AVIF形式
3. **キャッシング**: 静的アセット、APIレスポンス
4. **バンドル最適化**: Tree shaking、minification
5. **レンダリング最適化**: Server Components、Suspense

---

## 2. パフォーマンス指標

### 2.1 Core Web Vitals

```typescript
// lib/web-vitals.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

export function reportWebVitals() {
  onCLS(console.log);
  onFID(console.log);
  onLCP(console.log);
  onFCP(console.log);
  onTTFB(console.log);
}

// app/layout.tsx
import { reportWebVitals } from '@/lib/web-vitals';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (typeof window !== 'undefined') {
    reportWebVitals();
  }
  
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

---

## 3. 最適化手法

### 3.1 コード分割

#### 3.1.1 動的インポート

```typescript
// ✅ 重いコンポーネントを動的インポート
import dynamic from 'next/dynamic';

const GraphView = dynamic(
  () => import('@/components/graph/sigma-graph-view'),
  {
    loading: () => <GraphViewSkeleton />,
    ssr: false,
  }
);

const ContentGenerator = dynamic(
  () => import('@/components/content/content-generator'),
  {
    loading: () => <ContentGeneratorSkeleton />,
  }
);
```

#### 3.1.2 Route-based Code Splitting

```typescript
// Next.jsは自動的にルートごとにコード分割
// app/(dashboard)/projects/page.tsx
// → /projects のコードのみがロードされる
```

### 3.2 画像最適化

#### 3.2.1 Next.js Image

```typescript
// ✅ Next.js Imageを使用
import Image from 'next/image';

export function ProjectImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      priority={false}
      loading="lazy"
    />
  );
}
```

#### 3.2.2 画像形式の最適化

```typescript
// next.config.ts
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

### 3.3 バンドル最適化

#### 3.3.1 Tree Shaking

```typescript
// ✅ 必要なもののみインポート
import { Button } from '@/components/ui/button'; // 良い
import * as UI from '@/components/ui'; // 悪い（全てインポート）

// ✅ バレルエクスポートを避ける
// components/ui/index.ts
export { Button } from './button';
export { Input } from './input';
```

#### 3.3.2 パッケージ最適化

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
    ],
  },
};
```

### 3.4 レンダリング最適化

#### 3.4.1 Server Components

```typescript
// ✅ Server Componentでデータ取得
export default async function ProjectsPage() {
  const projects = await getProjects(); // サーバー側で実行
  
  return <ProjectsList projects={projects} />;
}
```

#### 3.4.2 Suspense

```typescript
// ✅ Suspenseで段階的ローディング
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <SlowComponent />
    </Suspense>
  );
}
```

---

## 4. 実装例

### 4.1 仮想化リスト

```typescript
// ✅ 大量のリストを仮想化
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualizedList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ItemCard item={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4.2 メモ化

```typescript
// ✅ useMemoで計算結果をメモ化
import { useMemo } from 'react';

export function ProjectStats({ projects }: { projects: Project[] }) {
  const stats = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
    };
  }, [projects]);

  return <div>{/* ... */}</div>;
}

// ✅ React.memoでコンポーネントをメモ化
export const ProjectCard = React.memo(({ project }: { project: Project }) => {
  return <div>{project.name}</div>;
});
```

---

## 5. 測定とモニタリング

### 5.1 Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run start &
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:3000
            http://localhost:3000/projects
          uploadArtifacts: true
```

---

## 🌐 必須参照リソース

1. [Web.dev Performance](https://web.dev/performance/)
2. [Next.js Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
3. [React Performance](https://react.dev/learn/render-and-commit)
4. [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

**推定実装時間**: 1-2週間（パフォーマンス最適化）

