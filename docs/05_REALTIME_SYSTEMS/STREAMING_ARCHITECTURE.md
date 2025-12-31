# ストリーミングアーキテクチャ完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: Server-Sent Events (SSE) + WebSocket + Streaming

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [ストリーミングアーキテクチャ](#2-ストリーミングアーキテクチャ)
3. [実装パターン](#3-実装パターン)
4. [詳細なコード実装例](#4-詳細なコード実装例)

---

## 1. エグゼクティブサマリー

### 1.1 ストリーミングの用途

Actoryでは、AIチャットの応答、文字起こしの進行状況、議事録生成の進捗などをストリーミングで配信します。

### 1.2 技術選定

- **Server-Sent Events (SSE)**: サーバー→クライアントの一方向ストリーミング
- **WebSocket**: 双方向リアルタイム通信
- **Streaming API**: OpenAI Streaming API統合

---

## 2. ストリーミングアーキテクチャ

### 2.1 SSE実装

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
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
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

### 2.2 クライアント側実装

```typescript
// components/chat/streaming-chat.tsx
'use client';

import { useState } from 'react';

export function StreamingChat() {
  const [message, setMessage] = useState('');
  const [streamedResponse, setStreamedResponse] = useState('');

  const sendMessage = async () => {
    setStreamedResponse('');
    
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            setStreamedResponse((prev) => prev + data.content);
          }
        }
      }
    }
  };

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>送信</button>
      <div>{streamedResponse}</div>
    </div>
  );
}
```

---

## 🌐 必須参照リソース

1. [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) - MDN
2. [OpenAI Streaming](https://platform.openai.com/docs/guides/text-generation) - OpenAI公式
3. [Next.js Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming) - Next.js公式

---

**推定実装時間**: 2-3週間（ストリーミングアーキテクチャ完全実装）

