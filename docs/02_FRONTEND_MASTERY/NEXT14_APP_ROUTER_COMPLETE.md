# Next.js 14 App Router 完全実装ガイド - エンタープライズグレード仕様

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: Next.js 14.2 LTS + React 18

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [App Routerアーキテクチャ詳解](#2-app-routerアーキテクチャ詳解)
3. [実装パターンとベストプラクティス](#3-実装パターンとベストプラクティス)
4. [詳細なコード実装例](#4-詳細なコード実装例)
5. [パフォーマンスチューニング](#5-パフォーマンスチューニング)
6. [トラブルシューティングガイド](#6-トラブルシューティングガイド)
7. [本番環境での考慮事項](#7-本番環境での考慮事項)

---

## 1. エグゼクティブサマリー

### 1.1 Next.js 14 App Routerの特徴

Next.js 14のApp Routerは、React Server Componentsを中核とした新しいルーティングシステムです。主な特徴：

- **Server Components**: デフォルトでサーバー側レンダリング
- **Streaming**: 段階的なデータローディングとUIストリーミング
- **Suspense統合**: ローディング状態の宣言的管理
- **Layouts**: ネストされたレイアウトによる効率的なUI構築
- **Route Groups**: ルーティングの論理的なグループ化

### 1.2 Actoryでの適用戦略

| 機能 | Server Component | Client Component | 理由 |
|------|------------------|------------------|------|
| プロジェクト一覧 | ✅ | ❌ | データフェッチ、SEO重要 |
| 録音画面 | ❌ | ✅ | インタラクティブ、MediaRecorder API |
| AIチャット | ❌ | ✅ | リアルタイム更新、フォーム |
| 議事録表示 | ✅ | ❌ | 静的コンテンツ、SEO重要 |
| カレンダー | ❌ | ✅ | インタラクティブ、ドラッグ&ドロップ |

---

## 2. App Routerアーキテクチャ詳解

### 2.1 ディレクトリ構造

```
app/
├── layout.tsx                 # ルートレイアウト（全ページ共通）
├── page.tsx                   # ルートページ（/）
├── loading.tsx                # グローバルローディングUI
├── error.tsx                  # グローバルエラーUI
├── global-error.tsx           # ルートエラーバウンダリ
│
├── (auth)/                    # Route Group（URLに影響しない）
│   ├── layout.tsx            # 認証ページ用レイアウト
│   └── login/
│       └── page.tsx          # /login
│
├── (dashboard)/               # Route Group
│   ├── layout.tsx            # ダッシュボードレイアウト
│   ├── loading.tsx           # ダッシュボード用ローディング
│   ├── page.tsx              # /（ダッシュボード）
│   │
│   ├── record/
│   │   └── page.tsx          # /record
│   │
│   ├── chat/
│   │   ├── layout.tsx        # チャット用レイアウト
│   │   ├── page.tsx          # /chat
│   │   └── [conversationId]/
│   │       └── page.tsx      # /chat/[id]
│   │
│   └── projects/
│       ├── page.tsx          # /projects
│       └── [id]/
│           ├── layout.tsx    # プロジェクト詳細レイアウト
│           ├── page.tsx      # /projects/[id]
│           └── structure/
│               └── page.tsx  # /projects/[id]/structure
│
└── api/                       # API Routes
    ├── trpc/
    │   └── [trpc]/
    │       └── route.ts      # tRPCエンドポイント
    └── recordings/
        └── upload/
            └── route.ts      # /api/recordings/upload
```

### 2.2 Server Components vs Client Components

#### 2.2.1 Server Componentsの利点

- **ゼロバンドルサイズ**: クライアントに送信されない
- **データベース直接アクセス**: サーバー側で直接DBクエリ
- **シークレットアクセス**: APIキーなどの機密情報を安全に使用
- **パフォーマンス**: 初期ロードが高速

#### 2.2.2 Client Componentsの使用場面

- **インタラクティブ性**: onClick、onChangeなどのイベントハンドラー
- **ブラウザAPI**: localStorage、MediaRecorder、WebSocket
- **状態管理**: useState、useEffectなどのReact Hooks
- **サードパーティライブラリ**: クライアント側のみで動作するライブラリ

### 2.3 データフェッチングパターン

#### 2.3.1 Server Componentsでのデータフェッチ

```typescript
// app/(dashboard)/projects/page.tsx
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // サーバー側で直接データベースクエリ
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id))
    .orderBy(desc(projects.createdAt));

  return (
    <div>
      <h1>プロジェクト一覧</h1>
      <ProjectsList projects={userProjects} />
    </div>
  );
}
```

#### 2.3.2 ストリーミングとSuspense

```typescript
// app/(dashboard)/projects/[id]/page.tsx
import { Suspense } from 'react';
import { ProjectHeader } from './project-header';
import { ProjectFiles } from './project-files';
import { ProjectTasks } from './project-tasks';

export default async function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <div>
      {/* 即座に表示 */}
      <Suspense fallback={<ProjectHeaderSkeleton />}>
        <ProjectHeader projectId={params.id} />
      </Suspense>

      <div className="grid grid-cols-2 gap-4">
        {/* 並列でロード */}
        <Suspense fallback={<FilesSkeleton />}>
          <ProjectFiles projectId={params.id} />
        </Suspense>

        <Suspense fallback={<TasksSkeleton />}>
          <ProjectTasks projectId={params.id} />
        </Suspense>
      </div>
    </div>
  );
}
```

---

## 3. 実装パターンとベストプラクティス

### 3.1 レイアウトパターン

#### 3.1.1 ネストされたレイアウト

```typescript
// app/(dashboard)/layout.tsx
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### 3.1.2 条件付きレイアウト

```typescript
// app/(dashboard)/chat/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen">
      <ChatSidebar userId={session.user.id} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
```

### 3.2 ルーティングパターン

#### 3.2.1 動的ルート

```typescript
// app/(dashboard)/projects/[id]/page.tsx
export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string };
}) {
  const project = await getProject(params.id);
  const activeTab = searchParams.tab || 'overview';

  return (
    <div>
      <ProjectTabs activeTab={activeTab} />
      {activeTab === 'overview' && <ProjectOverview project={project} />}
      {activeTab === 'files' && <ProjectFiles projectId={project.id} />}
      {activeTab === 'tasks' && <ProjectTasks projectId={project.id} />}
    </div>
  );
}
```

#### 3.2.2 並列ルート（Parallel Routes）

```typescript
// app/(dashboard)/projects/[id]/@overview/page.tsx
export default async function OverviewSlot() {
  const project = await getProject();
  return <ProjectOverview project={project} />;
}

// app/(dashboard)/projects/[id]/@files/page.tsx
export default async function FilesSlot() {
  const files = await getFiles();
  return <ProjectFiles files={files} />;
}

// app/(dashboard)/projects/[id]/layout.tsx
export default function ProjectLayout({
  children,
  overview,
  files,
}: {
  children: React.ReactNode;
  overview: React.ReactNode;
  files: React.ReactNode;
}) {
  return (
    <div>
      {overview}
      {files}
      {children}
    </div>
  );
}
```

### 3.3 データフェッチング最適化

#### 3.3.1 キャッシング戦略

```typescript
// デフォルト: キャッシュあり
export default async function CachedPage() {
  const data = await fetch('https://api.example.com/data');
  // 自動的にキャッシュされる
}

// 動的データ: キャッシュなし
export const revalidate = 0; // または 'force-cache'を明示的に無効化

export default async function DynamicPage() {
  const data = await fetch('https://api.example.com/data', {
    cache: 'no-store',
  });
}

// ISR: 時間ベースの再検証
export const revalidate = 3600; // 1時間ごとに再検証

// On-Demand Revalidation
export async function POST(request: Request) {
  const { id } = await request.json();
  
  revalidatePath(`/projects/${id}`);
  revalidateTag('projects');
  
  return Response.json({ revalidated: true });
}
```

#### 3.3.2 データフェッチの並列化

```typescript
// 悪い例: 順次実行
export default async function SequentialPage() {
  const projects = await getProjects(); // 1秒
  const tasks = await getTasks(); // 1秒
  // 合計: 2秒

  return <div>...</div>;
}

// 良い例: 並列実行
export default async function ParallelPage() {
  const [projects, tasks] = await Promise.all([
    getProjects(), // 1秒
    getTasks(),   // 1秒
  ]);
  // 合計: 1秒

  return <div>...</div>;
}
```

---

## 4. 詳細なコード実装例

### 4.1 Server Actions実装

```typescript
// app/actions/project.ts
'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  // バリデーション
  if (!name || name.length < 1) {
    return { error: 'プロジェクト名は必須です' };
  }

  try {
    const project = await db.insert(projects).values({
      userId: session.user.id,
      name,
      description,
    }).returning();

    // キャッシュを無効化
    revalidatePath('/projects');
    
    return { success: true, project: project[0] };
  } catch (error) {
    return { error: 'プロジェクトの作成に失敗しました' };
  }
}

export async function updateProject(id: number, data: Partial<Project>) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // 権限チェック
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, id),
      eq(projects.userId, session.user.id)
    ),
  });

  if (!project) {
    throw new Error('Project not found');
  }

  await db.update(projects)
    .set(data)
    .where(eq(projects.id, id));

  revalidatePath(`/projects/${id}`);
  revalidatePath('/projects');
}
```

### 4.2 フォーム処理パターン

```typescript
// app/(dashboard)/projects/new/page.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createProject } from '@/app/actions/project';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary"
    >
      {pending ? '作成中...' : '作成'}
    </button>
  );
}

export default function NewProjectPage() {
  const [state, formAction] = useFormState(createProject, null);

  return (
    <form action={formAction}>
      <div>
        <label htmlFor="name">プロジェクト名</label>
        <input
          id="name"
          name="name"
          required
          className="input"
        />
        {state?.error && (
          <p className="text-red-500">{state.error}</p>
        )}
      </div>

      <div>
        <label htmlFor="description">説明</label>
        <textarea
          id="description"
          name="description"
          className="textarea"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
```

### 4.3 エラーハンドリング

```typescript
// app/(dashboard)/projects/[id]/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログを送信
    console.error('Project error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">エラーが発生しました</h2>
      <p className="text-muted-foreground mb-4">
        {error.message || '予期しないエラーが発生しました'}
      </p>
      <Button onClick={reset}>
        再試行
      </Button>
    </div>
  );
}
```

---

## 5. パフォーマンスチューニング

### 5.1 バンドルサイズ最適化

```typescript
// next.config.ts
const nextConfig = {
  // 実験的機能
  experimental: {
    optimizePackageImports: ['@/components', '@/lib'],
  },
  
  // 画像最適化
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  
  // コンパイラ最適化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

### 5.2 動的インポート

```typescript
// 重いコンポーネントを動的インポート
import dynamic from 'next/dynamic';

const GraphView = dynamic(
  () => import('@/components/graph/sigma-graph-view'),
  {
    loading: () => <GraphViewSkeleton />,
    ssr: false, // クライアント側のみ
  }
);

const ContentGenerator = dynamic(
  () => import('@/components/content/content-generator'),
  {
    loading: () => <ContentGeneratorSkeleton />,
  }
);
```

---

## 6. トラブルシューティングガイド

### 6.1 よくある問題

#### 問題1: "use client"ディレクティブの誤用

**症状**: Server Componentでクライアント専用APIを使用

**解決策**: 適切に"use client"を追加

```typescript
// ❌ 悪い例
export default function Component() {
  const [state, setState] = useState(); // エラー
}

// ✅ 良い例
'use client';

export default function Component() {
  const [state, setState] = useState(); // OK
}
```

#### 問題2: 非同期コンポーネントの型エラー

**解決策**: Promise型を正しく処理

```typescript
// ✅ 正しい型定義
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // ...
}
```

---

## 7. 本番環境での考慮事項

### 7.1 環境変数管理

```typescript
// .env.local（開発環境）
DATABASE_URL=file:./local.db
OPENAI_API_KEY=sk-...

// .env.production（本番環境）
DATABASE_URL=${TURSO_DATABASE_URL}
OPENAI_API_KEY=${OPENAI_API_KEY}
```

### 7.2 エラーロギング

```typescript
// lib/error-logger.ts
export async function logError(error: Error, context?: Record<string, any>) {
  // Sentry、LogRocket、Datadogなどに送信
  console.error('Error:', error, context);
}
```

---

## 🌐 必須参照リソース（最低10個）

### 公式ドキュメント（5個以上）

1. [Next.js 14 Documentation](https://nextjs.org/docs) - メイン公式サイト
2. [Next.js App Router](https://nextjs.org/docs/app) - App Router完全ガイド
3. [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components) - サーバーコンポーネント仕様
4. [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching) - データフェッチング
5. [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching) - キャッシング戦略

### 実装記事・チュートリアル（5個以上）

6. [Vercel Next.js 14 Guide](https://vercel.com/docs/frameworks/nextjs) - Vercel公式ガイド
7. [Next.js App Router Migration](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration) - 移行ガイド
8. [Server Components Deep Dive](https://www.patterns.dev/posts/react-server-components) - サーバーコンポーネント詳細解説
9. [Next.js Performance Optimization](https://nextjs.org/docs/app/building-your-application/optimizing) - パフォーマンス最適化
10. [Next.js Best Practices](https://nextjs.org/docs/app/building-your-application/routing) - ベストプラクティス

### 追加リソース（ボーナス）

11. [Next.js GitHub Repository](https://github.com/vercel/next.js) - ソースコード
12. [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples) - 実装例
13. [Next.js Blog](https://nextjs.org/blog) - 最新情報
14. [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md) - RFC仕様
15. [Next.js Conf Talks](https://www.youtube.com/results?search_query=next.js+conf) - カンファレンス動画

---

**推定実装時間**: 2-3週間（完全なApp Router移行）

**次のステップ**: `REACT_SERVER_COMPONENTS.md` を参照してServer Componentsの詳細を理解してください。

