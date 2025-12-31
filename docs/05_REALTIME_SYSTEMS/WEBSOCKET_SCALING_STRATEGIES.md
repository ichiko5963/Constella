# WebSocket スケーリング戦略完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: WebSocket + Redis Pub/Sub + 水平スケーリング

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [WebSocketアーキテクチャ詳解](#2-websocketアーキテクチャ詳解)
3. [スケーリング戦略](#3-スケーリング戦略)
4. [詳細なコード実装例](#4-詳細なコード実装例)
5. [パフォーマンスチューニング](#5-パフォーマンスチューニング)

---

## 1. エグゼクティブサマリー

### 1.1 WebSocketの課題

単一サーバーでのWebSocket接続は、水平スケーリング時に問題が発生します。複数のサーバーインスタンス間でメッセージを共有する必要があります。

### 1.2 Actoryでの解決策

- **Redis Pub/Sub**: サーバー間のメッセージ共有
- **Sticky Sessions**: セッションアフィニティ
- **Connection Pooling**: 接続の効率的管理
- **Heartbeat**: 接続の死活監視

---

## 2. WebSocketアーキテクチャ詳解

### 2.1 アーキテクチャ図

```
┌─────────────────────────────────────────┐
│         Load Balancer                   │
│    (Sticky Sessions)                    │
└────────┬────────────────────────────────┘
         │
    ┌────┴────┐
    │        │
    ▼        ▼
┌────────┐ ┌────────┐
│Server 1│ │Server 2│
│WS:3001 │ │WS:3002 │
└───┬────┘ └───┬────┘
    │          │
    └────┬─────┘
         │
         ▼
┌─────────────────────────┐
│   Redis Pub/Sub         │
│   (Message Broker)      │
└─────────────────────────┘
```

### 2.2 WebSocketサーバー実装

```typescript
// server/websocket/server.ts
import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from 'redis';
import { Server } from 'http';

export class WebSocketManager {
  private wss: WebSocketServer;
  private redisClient: ReturnType<typeof createClient>;
  private redisSubscriber: ReturnType<typeof createClient>;
  private connections: Map<string, WebSocket> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.redisClient = createClient({ url: process.env.REDIS_URL });
    this.redisSubscriber = createClient({ url: process.env.REDIS_URL });

    this.initialize();
  }

  private async initialize() {
    await this.redisClient.connect();
    await this.redisSubscriber.connect();

    // Redis購読
    await this.redisSubscriber.subscribe('actory:messages', (message) => {
      const { userId, data } = JSON.parse(message);
      this.sendToUser(userId, data);
    });

    // WebSocket接続処理
    this.wss.on('connection', (ws: WebSocket, req) => {
      const userId = this.extractUserId(req);
      this.connections.set(userId, ws);

      // ハートビート
      this.setupHeartbeat(ws, userId);

      // メッセージ受信
      ws.on('message', (data) => {
        this.handleMessage(userId, data);
      });

      // 切断処理
      ws.on('close', () => {
        this.connections.delete(userId);
      });
    });
  }

  private async handleMessage(userId: string, data: Buffer) {
    const message = JSON.parse(data.toString());
    
    // Redisに発行（他のサーバーに配信）
    await this.redisClient.publish(
      'actory:messages',
      JSON.stringify({ userId, data: message })
    );
  }

  private sendToUser(userId: string, data: any) {
    const ws = this.connections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  private setupHeartbeat(ws: WebSocket, userId: string) {
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(interval);
        this.connections.delete(userId);
      }
    }, 30000); // 30秒ごと

    ws.on('pong', () => {
      // 接続確認
    });
  }

  private extractUserId(req: any): string {
    // 認証トークンからユーザーIDを抽出
    const token = req.headers.authorization?.replace('Bearer ', '');
    // JWTデコード処理
    return 'user-id'; // 実際の実装ではJWTから取得
  }
}
```

---

## 3. スケーリング戦略

### 3.1 Redis Pub/Subパターン

```typescript
// server/websocket/redis-pubsub.ts
export class RedisPubSub {
  private publisher: ReturnType<typeof createClient>;
  private subscriber: ReturnType<typeof createClient>;

  constructor() {
    this.publisher = createClient({ url: process.env.REDIS_URL });
    this.subscriber = createClient({ url: process.env.REDIS_URL });
  }

  async initialize() {
    await this.publisher.connect();
    await this.subscriber.connect();
  }

  async publish(channel: string, message: any) {
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, handler: (message: any) => void) {
    await this.subscriber.subscribe(channel, (message) => {
      handler(JSON.parse(message));
    });
  }
}
```

### 3.2 接続管理

```typescript
// server/websocket/connection-manager.ts
export class ConnectionManager {
  private connections: Map<string, Set<WebSocket>> = new Map();

  addConnection(userId: string, ws: WebSocket) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(ws);
  }

  removeConnection(userId: string, ws: WebSocket) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(ws);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  sendToUser(userId: string, message: any) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      const data = JSON.stringify(message);
      userConnections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
    }
  }

  broadcast(message: any) {
    const data = JSON.stringify(message);
    this.connections.forEach((userConnections) => {
      userConnections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
    });
  }
}
```

---

## 4. 詳細なコード実装例

### 4.1 Actoryでの実装

```typescript
// app/api/websocket/route.ts
import { NextRequest } from 'next/server';
import { WebSocketManager } from '@/server/websocket/server';

let wsManager: WebSocketManager | null = null;

export async function GET(request: NextRequest) {
  if (!wsManager) {
    // WebSocketサーバーを初期化
    // (実際の実装では、Next.jsのWebSocketサポートを使用)
  }

  return new Response('WebSocket endpoint', { status: 200 });
}
```

---

## 🌐 必須参照リソース

1. [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) - MDN
2. [ws Library](https://github.com/websockets/ws) - Node.js WebSocket
3. [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/) - Redis公式
4. [Scaling WebSockets](https://www.nginx.com/blog/websocket-nginx/) - Nginx

---

**推定実装時間**: 2-3週間（WebSocketスケーリング実装）

