# ライブコラボレーションエンジン完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: Yjs + WebSocket + CRDT

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [Yjs実装](#2-yjs実装)
3. [リアルタイム同期](#3-リアルタイム同期)

---

## 1. エグゼクティブサマリー

### 1.1 ライブコラボレーションとは

複数のユーザーが同時に同じドキュメントを編集できる機能です。Actoryでは、議事録の共同編集に使用します。

### 1.2 技術選定

- **Yjs**: CRDTベースのコラボレーションフレームワーク
- **WebSocket**: リアルタイム通信
- **Yjs WebSocket Provider**: YjsとWebSocketの統合

---

## 2. Yjs実装

### 2.1 サーバー側実装

```typescript
// server/websocket/yjs-provider.ts
import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { setupWSConnection } from 'y-websocket/bin/utils';

const wss = new WebSocketServer({ port: 1234 });

wss.on('connection', (ws, req) => {
  const doc = new Y.Doc();
  setupWSConnection(ws, doc);
});
```

### 2.2 クライアント側実装

```typescript
// components/editor/collaborative-editor.tsx
'use client';

import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useEditor } from '@tiptap/react';

export function CollaborativeEditor({ documentId }: { documentId: string }) {
  const [ydoc] = useState(() => new Y.Doc());
  const [provider] = useState(() => 
    new WebsocketProvider('ws://localhost:1234', documentId, ydoc)
  );

  const editor = useEditor({
    extensions: [StarterKit],
    editorProps: {
      attributes: {
        class: 'prose max-w-none',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    const yXmlFragment = ydoc.getXmlFragment('prosemirror');
    
    // YjsとProseMirrorを同期
    const binding = new ProsemirrorBinding(yXmlFragment, editor.view);

    return () => {
      binding.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [editor, ydoc, provider]);

  return <EditorContent editor={editor} />;
}
```

---

## 🌐 必須参照リソース

1. [Yjs Documentation](https://docs.yjs.dev/) - Yjs公式
2. [Yjs WebSocket](https://github.com/yjs/y-websocket) - WebSocket Provider
3. [CRDT Explained](https://crdt.tech/) - CRDT解説

---

**推定実装時間**: 3-4週間（ライブコラボレーション完全実装）

