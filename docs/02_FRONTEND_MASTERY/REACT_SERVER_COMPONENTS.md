# React Server Components 完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: React 18 + Next.js 14

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [Server Componentsアーキテクチャ詳解](#2-server-componentsアーキテクチャ詳解)
3. [実装パターンとベストプラクティス](#3-実装パターンとベストプラクティス)
4. [詳細なコード実装例](#4-詳細なコード実装例)
5. [パフォーマンスチューニング](#5-パフォーマンスチューニング)
6. [トラブルシューティングガイド](#6-トラブルシューティングガイド)
7. [本番環境での考慮事項](#7-本番環境での考慮事項)

---

## 1. エグゼクティブサマリー

### 1.1 Server Componentsとは

React Server Components (RSC) は、サーバー側でレンダリングされ、クライアントにJavaScriptバンドルとして送信されない新しいReactコンポーネントモデルです。

### 1.2 主な特徴

- **ゼロバンドルサイズ**: クライアントに送信されない
- **データベース直接アクセス**: サーバー側で直接DBクエリ
- **シークレットアクセス**: APIキーなどの機密情報を安全に使用
- **パフォーマンス**: 初期ロードが高速

### 1.3 Actoryでの適用戦略

| コンポーネント | Server Component | Client Component | 理由 |
|---------------|-------------------|------------------|------|
| プロジェクト一覧 | ✅ | ❌ | データフェッチ、SEO重要 |
| 議事録表示 | ✅ | ❌ | 静的コンテンツ、SEO重要 |
| 録音画面 | ❌ | ✅ | インタラクティブ、MediaRecorder API |
| AIチャット | ❌ | ✅ | リアルタイム更新、フォーム |
| カレンダー | ❌ | ✅ | インタラクティブ、ドラッグ&ドロップ |

---

## 2. Server Componentsアーキテクチャ詳解

### 2.1 Server Componentsの動作原理

```
┌─────────────────────────────────────────┐
│         Server (Next.js)                │
│  ┌───────────────────────────────────┐  │
│  │  Server Component                │  │
│  │  - データベースクエリ            │  │
│  │  - サーバー側レンダリング        │  │
│  │  - HTML生成                      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              │
              ▼ HTMLストリーミング
┌─────────────────────────────────────────┐
│         Client (Browser)               │
│  ┌───────────────────────────────────┐  │
│  │  Hydrated HTML                    │  │
│  │  - インタラクティブな部分のみ      │  │
│  │  - Client Component               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 2.2 Server Components vs Client Components

#### 2.2.1 Server Componentsの利点

```typescript
// ✅ Server Component - データベース直接アクセス
// app/(dashboard)/projects/page.tsx
import { db } from '@/db';
import { projects } from '@/db/schema';
import { auth } from '@/auth';

export default async function ProjectsPage() {
  const session = await auth();
  
  // サーバー側で直接データベースクエリ
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id));
  
  return (
    <div>
      <h1>プロジェクト一覧</h1>
      <ProjectsList projects={userProjects} />
    </div>
  );
}
```

#### 2.2.2 Client Componentsの使用場面

```typescript
// ✅ Client Component - インタラクティブ機能
// components/recording/audio-recorder.tsx
'use client';

import { useState, useRef } from 'react';

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.start();
    setIsRecording(true);
  };
  
  return (
    <button onClick={startRecording}>
      {isRecording ? '録音中...' : '録音開始'}
    </button>
  );
}
```

---

## 3. 実装パターンとベストプラクティス

### 3.1 Server/Client Componentの境界設計

#### 3.1.1 パターン1: Server Componentでデータ取得、Client Componentで表示

```typescript
// ✅ 良い例: Server Componentでデータ取得
// app/(dashboard)/projects/[id]/page.tsx
import { getProject } from '@/server/actions/project';
import { ProjectViewer } from '@/components/project/project-viewer';

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  
  return <ProjectViewer project={project} />;
}

// ✅ Client Componentでインタラクティブな表示
// components/project/project-viewer.tsx
'use client';

import { useState } from 'react';

export function ProjectViewer({ project }: { project: Project }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'tasks'>('overview');
  
  return (
    <div>
      <h1>{project.name}</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="files">ファイル</TabsTrigger>
          <TabsTrigger value="tasks">タスク</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">{project.description}</TabsContent>
        <TabsContent value="files"><FileList projectId={project.id} /></TabsContent>
        <TabsContent value="tasks"><TaskList projectId={project.id} /></TabsContent>
      </Tabs>
    </div>
  );
}
```

#### 3.1.2 パターン2: Server Componentでレイアウト、Client Componentでコンテンツ

```typescript
// ✅ Server Componentでレイアウト
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

// ✅ Client Componentでインタラクティブなサイドバー
// components/dashboard/sidebar.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function DashboardSidebar() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/dashboard', label: 'ホーム' },
    { href: '/projects', label: 'プロジェクト' },
    { href: '/record', label: '録音' },
    { href: '/chat', label: 'AIチャット' },
  ];
  
  return (
    <nav className="w-64 bg-gray-900 text-white">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={pathname === item.href ? 'active' : ''}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

### 3.2 データフェッチングパターン

#### 3.2.1 Server Componentでの並列データフェッチ

```typescript
// ✅ 並列データフェッチ
// app/(dashboard)/projects/[id]/page.tsx
import { getProject } from '@/server/actions/project';
import { getProjectFiles } from '@/server/actions/file';
import { getProjectTasks } from '@/server/actions/task';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  // Promise.allで並列実行
  const [project, files, tasks] = await Promise.all([
    getProject(params.id),
    getProjectFiles(params.id),
    getProjectTasks(params.id),
  ]);
  
  return (
    <div>
      <ProjectHeader project={project} />
      <div className="grid grid-cols-2 gap-4">
        <FileList files={files} />
        <TaskList tasks={tasks} />
      </div>
    </div>
  );
}
```

#### 3.2.2 Suspenseを使った段階的ローディング

```typescript
// ✅ Suspenseで段階的ローディング
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

// 各コンポーネントは非同期でデータを取得
async function ProjectHeader({ projectId }: { projectId: string }) {
  const project = await getProject(projectId);
  return <h1>{project.name}</h1>;
}

async function ProjectFiles({ projectId }: { projectId: string }) {
  const files = await getProjectFiles(projectId);
  return <FileList files={files} />;
}

async function ProjectTasks({ projectId }: { projectId: string }) {
  const tasks = await getProjectTasks(projectId);
  return <TaskList tasks={tasks} />;
}
```

### 3.3 Server Actionsパターン

#### 3.3.1 Server Actionsの実装

```typescript
// ✅ Server Action
// server/actions/project.ts
'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { revalidatePath } from 'next/cache';

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

  await db.update(projects)
    .set(data)
    .where(eq(projects.id, id));

  revalidatePath(`/projects/${id}`);
  revalidatePath('/projects');
}
```

#### 3.3.2 Server Actionsとフォーム統合

```typescript
// ✅ Server Actionとフォーム統合
// app/(dashboard)/projects/new/page.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createProject } from '@/server/actions/project';

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

---

## 4. 詳細なコード実装例

### 4.1 Actoryでの実装例

#### 4.1.1 プロジェクト一覧ページ

```typescript
// app/(dashboard)/projects/page.tsx
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ProjectCard } from '@/components/project/project-card';
import { CreateProjectButton } from '@/components/project/create-project-button';

export default async function ProjectsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Server Componentで直接データベースクエリ
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id))
    .orderBy(desc(projects.createdAt));

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">プロジェクト一覧</h1>
        <CreateProjectButton />
      </div>

      {userProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">プロジェクトがありません</p>
          <CreateProjectButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 4.1.2 議事録表示コンポーネント

```typescript
// app/(dashboard)/meetings/[id]/page.tsx
import { getMeetingNote } from '@/server/actions/meeting';
import { MeetingNoteViewer } from '@/components/meeting/meeting-note-viewer';
import { notFound } from 'next/navigation';

export default async function MeetingNotePage({ params }: { params: { id: string } }) {
  const meetingNote = await getMeetingNote(params.id);
  
  if (!meetingNote) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <MeetingNoteViewer meetingNote={meetingNote} />
    </div>
  );
}

// components/meeting/meeting-note-viewer.tsx
'use client';

import { useState } from 'react';
import { MeetingNote } from '@/db/schema';
import { ShareButton } from '@/components/note/share-button';
import { EditButton } from '@/components/note/edit-button';

export function MeetingNoteViewer({ meetingNote }: { meetingNote: MeetingNote }) {
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <article className="prose max-w-none">
      <div className="flex justify-between items-start mb-4">
        <h1>{meetingNote.title}</h1>
        <div className="flex gap-2">
          <EditButton 
            meetingNoteId={meetingNote.id}
            onEdit={() => setIsEditing(true)}
          />
          <ShareButton meetingNoteId={meetingNote.id} />
        </div>
      </div>
      
      {isEditing ? (
        <MeetingNoteEditor 
          meetingNote={meetingNote}
          onSave={() => setIsEditing(false)}
        />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: meetingNote.formattedMinutes }} />
      )}
    </article>
  );
}
```

### 4.2 ストリーミング実装

#### 4.2.1 ストリーミングレスポンス

```typescript
// app/api/chat/stream/route.ts
import { OpenAI } from 'openai';
import { auth } from '@/auth';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message } = await request.json();

  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: message }],
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        controller.enqueue(encoder.encode(content));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

#### 4.2.2 クライアント側でのストリーミング受信

```typescript
// components/chat/chat-message.tsx
'use client';

import { useState, useEffect } from 'react';

export function ChatMessage({ message }: { message: string }) {
  const [streamedMessage, setStreamedMessage] = useState('');

  useEffect(() => {
    const eventSource = new EventSource(`/api/chat/stream?message=${encodeURIComponent(message)}`);
    
    eventSource.onmessage = (event) => {
      setStreamedMessage(prev => prev + event.data);
    };
    
    eventSource.onerror = () => {
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
    };
  }, [message]);

  return <div>{streamedMessage}</div>;
}
```

---

## 5. パフォーマンスチューニング

### 5.1 バンドルサイズ最適化

#### 5.1.1 動的インポート

```typescript
// ✅ 重いコンポーネントを動的インポート
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

#### 5.1.2 コード分割

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      '@/components',
      '@/lib',
      'lucide-react',
      '@radix-ui/react-dialog',
    ],
  },
};
```

### 5.2 キャッシング戦略

#### 5.2.1 データキャッシング

```typescript
// ✅ データをキャッシュ
// app/(dashboard)/projects/page.tsx
export const revalidate = 3600; // 1時間ごとに再検証

export default async function ProjectsPage() {
  // このデータは1時間キャッシュされる
  const projects = await db.query.projects.findMany();
  
  return <ProjectsList projects={projects} />;
}
```

#### 5.2.2 React Queryとの統合

```typescript
// ✅ Client ComponentでReact Queryを使用
// components/project/project-list.tsx
'use client';

import { useQuery } from '@tanstack/react-query';

export function ProjectList() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5分
  });

  if (isLoading) return <ProjectsSkeleton />;

  return (
    <div>
      {projects?.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
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

#### 問題2: Server ComponentからClient Componentへのprops渡し

**症状**: シリアライズ不可能なデータを渡す

**解決策**: シリアライズ可能なデータのみを渡す

```typescript
// ❌ 悪い例
export default function ServerComponent() {
  const onClick = () => {}; // 関数は渡せない
  return <ClientComponent onClick={onClick} />;
}

// ✅ 良い例
export default function ServerComponent() {
  return <ClientComponent data={{ id: 1, name: 'test' }} />;
}
```

---

## 7. 本番環境での考慮事項

### 7.1 エラーハンドリング

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

### 7.2 ローディング状態

```typescript
// app/(dashboard)/projects/[id]/loading.tsx
export default function ProjectLoading() {
  return (
    <div className="container mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  );
}
```

---

## 🌐 必須参照リソース（最低10個）

### 公式ドキュメント（5個以上）

1. [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md) - サーバーコンポーネント仕様
2. [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming) - Next.js実装
3. [React Documentation](https://react.dev/) - React公式ドキュメント
4. [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching) - データフェッチング
5. [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching) - キャッシング戦略

### 実装記事・チュートリアル（5個以上）

6. [Server Components Deep Dive](https://www.patterns.dev/posts/react-server-components) - 詳細解説
7. [Vercel Server Components Guide](https://vercel.com/blog/understanding-react-server-components) - Vercel公式ガイド
8. [Next.js App Router Migration](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration) - 移行ガイド
9. [React Server Components Explained](https://www.youtube.com/watch?v=TQQPAU21ZUw) - YouTube解説
10. [Server Components Best Practices](https://nextjs.org/docs/app/building-your-application/rendering/server-components) - ベストプラクティス

### 追加リソース（ボーナス）

11. [React GitHub Repository](https://github.com/facebook/react) - ソースコード
12. [Next.js GitHub Repository](https://github.com/vercel/next.js) - ソースコード
13. [React Server Components Demo](https://github.com/reactjs/server-components-demo) - デモプロジェクト
14. [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples) - 実装例
15. [React Conf Talks](https://www.youtube.com/results?search_query=react+conf+server+components) - カンファレンス動画

---

**推定実装時間**: 2-3週間（Server Components完全実装）

**次のステップ**: `ADVANCED_STATE_MANAGEMENT.md` を参照して高度な状態管理を実装してください。

