# 高度な状態管理完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: React 18 + Next.js 14 + Zustand + React Query

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [状態管理アーキテクチャ詳解](#2-状態管理アーキテクチャ詳解)
3. [実装パターンとベストプラクティス](#3-実装パターンとベストプラクティス)
4. [詳細なコード実装例](#4-詳細なコード実装例)
5. [パフォーマンスチューニング](#5-パフォーマンスチューニング)
6. [トラブルシューティングガイド](#6-トラブルシューティングガイド)

---

## 1. エグゼクティブサマリー

### 1.1 状態管理戦略

Actoryでは、以下の状態管理ライブラリを用途に応じて使い分けます：

- **Zustand**: グローバルUI状態（サイドバーの開閉、テーマなど）
- **React Query**: サーバー状態（APIデータ、キャッシング）
- **React Context**: コンポーネントツリー内の状態共有
- **useState/useReducer**: ローカルコンポーネント状態

### 1.2 状態管理の分類

| 状態の種類 | ライブラリ | 使用例 |
|-----------|-----------|--------|
| サーバー状態 | React Query | プロジェクト一覧、議事録データ |
| グローバルUI状態 | Zustand | サイドバー開閉、モーダル状態 |
| フォーム状態 | React Hook Form | プロジェクト作成フォーム |
| リアルタイム状態 | WebSocket + Zustand | 録音状態、チャットメッセージ |

---

## 2. 状態管理アーキテクチャ詳解

### 2.1 状態管理レイヤー

```
┌─────────────────────────────────────────┐
│      Server State (React Query)         │
│  - APIデータ                              │
│  - キャッシング                           │
│  - バックグラウンド更新                    │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      Global UI State (Zustand)         │
│  - サイドバー開閉                         │
│  - テーマ設定                             │
│  - モーダル状態                           │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      Component State (useState)        │
│  - ローカルUI状態                        │
│  - 一時的な状態                          │
└─────────────────────────────────────────┘
```

### 2.2 React Query設定

```typescript
// lib/react-query-config.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分
      cacheTime: 10 * 60 * 1000, // 10分
      refetchOnWindowFocus: false,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});
```

---

## 3. 実装パターンとベストプラクティス

### 3.1 React Queryパターン

#### 3.1.1 データフェッチング

```typescript
// hooks/use-projects.ts
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      return trpc.project.list.query();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      return trpc.project.getById.query({ id });
    },
    enabled: !!id,
  });
}
```

#### 3.1.2 データ更新（Mutation）

```typescript
// hooks/use-project-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return trpc.project.create.mutate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('プロジェクトを作成しました');
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Project> }) => {
      return trpc.project.update.mutate({ id, ...data });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] });
      toast.success('プロジェクトを更新しました');
    },
  });
}
```

#### 3.1.3 オプティミスティック更新

```typescript
// hooks/use-optimistic-update.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useOptimisticUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Project> }) => {
      return trpc.project.update.mutate({ id, ...data });
    },
    onMutate: async ({ id, data }) => {
      // 進行中のリクエストをキャンセル
      await queryClient.cancelQueries({ queryKey: ['projects', id] });

      // スナップショットを保存
      const previousProject = queryClient.getQueryData(['projects', id]);

      // オプティミスティックに更新
      queryClient.setQueryData(['projects', id], (old: Project) => ({
        ...old,
        ...data,
      }));

      return { previousProject };
    },
    onError: (err, variables, context) => {
      // エラー時はロールバック
      if (context?.previousProject) {
        queryClient.setQueryData(['projects', variables.id], context.previousProject);
      }
    },
    onSettled: (data, error, variables) => {
      // 最終的にサーバーデータで更新
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] });
    },
  });
}
```

### 3.2 Zustandパターン

#### 3.2.1 グローバルUI状態

```typescript
// stores/ui-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'system',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
    }
  )
);
```

#### 3.2.2 録音状態管理

```typescript
// stores/recording-store.ts
import { create } from 'zustand';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<Blob>;
  reset: () => void;
}

export const useRecordingStore = create<RecordingState>((set, get) => ({
  isRecording: false,
  isPaused: false,
  duration: 0,
  audioBlob: null,

  startRecording: async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      set({ audioBlob: blob });
    };

    mediaRecorder.start();
    set({ isRecording: true, isPaused: false });

    // タイマー開始
    const interval = setInterval(() => {
      if (get().isRecording && !get().isPaused) {
        set((state) => ({ duration: state.duration + 1 }));
      }
    }, 1000);

    // ストアに保存（クリーンアップ用）
    (window as any).recordingInterval = interval;
  },

  pauseRecording: () => {
    set({ isPaused: true });
  },

  resumeRecording: () => {
    set({ isPaused: false });
  },

  stopRecording: async () => {
    const mediaRecorder = (window as any).mediaRecorder;
    if (mediaRecorder && get().isRecording) {
      mediaRecorder.stop();
      set({ isRecording: false, isPaused: false });
      
      const interval = (window as any).recordingInterval;
      if (interval) {
        clearInterval(interval);
      }
    }

    return get().audioBlob!;
  },

  reset: () => {
    set({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
    });
  },
}));
```

---

## 4. 詳細なコード実装例

### 4.1 チャット状態管理

```typescript
// stores/chat-store.ts
import { create } from 'zustand';
import { Message } from '@/db/schema';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessages: (messages) => set({ messages }),

  setLoading: (isLoading) => set({ isLoading }),

  clearMessages: () => set({ messages: [] }),
}));
```

### 4.2 WebSocket統合

```typescript
// hooks/use-chat-websocket.ts
import { useEffect } from 'react';
import { useChatStore } from '@/stores/chat-store';

export function useChatWebSocket(conversationId: string) {
  const { addMessage, setLoading } = useChatStore();

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3001/chat/${conversationId}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      addMessage(message);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setLoading(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [conversationId, addMessage, setLoading]);
}
```

---

## 5. パフォーマンスチューニング

### 5.1 メモ化

```typescript
// ✅ useMemoで計算結果をメモ化
import { useMemo } from 'react';

export function ProjectStats({ projects }: { projects: Project[] }) {
  const stats = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
    };
  }, [projects]);

  return (
    <div>
      <p>総数: {stats.total}</p>
      <p>アクティブ: {stats.active}</p>
      <p>完了: {stats.completed}</p>
    </div>
  );
}
```

### 5.2 仮想化

```typescript
// ✅ 大量のリストを仮想化
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualizedProjectList({ projects }: { projects: Project[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
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
            <ProjectCard project={projects[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 6. トラブルシューティングガイド

### 6.1 よくある問題

#### 問題1: 無限ループ

**症状**: useEffectが無限に実行される

**解決策**: 依存配列を正しく設定

```typescript
// ❌ 悪い例
useEffect(() => {
  fetchData();
}, [data]); // dataが変更されるたびに再実行

// ✅ 良い例
useEffect(() => {
  fetchData();
}, []); // 初回のみ実行
```

#### 問題2: 状態の不整合

**症状**: 複数の状態が同期しない

**解決策**: 単一の状態ソースを使用

```typescript
// ❌ 悪い例: 複数の状態ソース
const [projects, setProjects] = useState([]);
const queryProjects = useQuery(['projects'], fetchProjects);

// ✅ 良い例: 単一の状態ソース
const { data: projects } = useQuery(['projects'], fetchProjects);
```

---

## 🌐 必須参照リソース（最低10個）

### 公式ドキュメント（5個以上）

1. [React Query Documentation](https://tanstack.com/query/latest) - React Query公式
2. [Zustand Documentation](https://zustand-demo.pmnd.rs/) - Zustand公式
3. [React Hook Form](https://react-hook-form.com/) - React Hook Form公式
4. [React useReducer](https://react.dev/reference/react/useReducer) - useReducer API
5. [React Context](https://react.dev/reference/react/useContext) - Context API

### 実装記事・チュートリアル（5個以上）

6. [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query) - ベストプラクティス
7. [State Management Comparison](https://www.patterns.dev/posts/react-state-patterns) - 状態管理比較
8. [Zustand vs Redux](https://blog.logrocket.com/zustand-react-state-management/) - Zustand解説
9. [React Query Tutorial](https://www.youtube.com/watch?v=novnyCaa7To) - YouTubeチュートリアル
10. [Advanced React Patterns](https://kentcdodds.com/blog/compound-components-with-react-hooks) - 高度なパターン

---

**推定実装時間**: 2-3週間（完全な状態管理実装）

**次のステップ**: `PERFORMANCE_OPTIMIZATION.md` を参照してパフォーマンス最適化を実装してください。

