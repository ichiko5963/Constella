# Actory エンタープライズシステム設計 - 完全実装ガイド

**バージョン**: 3.0.0  
**最終更新日**: 2024年12月21日  
**作成者**: Enterprise AI Architect  
**対象システム**: Actory - 行動直結型ナレッジOS

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [アーキテクチャ詳解](#2-アーキテクチャ詳解)
3. [実装パターンとベストプラクティス](#3-実装パターンとベストプラクティス)
4. [詳細なコード実装例](#4-詳細なコード実装例)
5. [パフォーマンスチューニング](#5-パフォーマンスチューニング)
6. [トラブルシューティングガイド](#6-トラブルシューティングガイド)
7. [本番環境での考慮事項](#7-本番環境での考慮事項)
8. [自動実装プロンプト](#8-自動実装プロンプト)

---

## 1. エグゼクティブサマリー

### 1.1 システム概要

Actoryは、音声録音から議事録生成、タスク管理、ナレッジ蓄積までをシームレスに統合した、エンタープライズグレードのAIファーストプロダクティビティプラットフォームです。本システムは、以下の特徴を持つ分散システムアーキテクチャを採用しています：

- **マイクロサービスアーキテクチャ**: 各機能を独立したサービスとして実装
- **イベント駆動型設計**: 非同期処理による高いスケーラビリティ
- **エッジコンピューティング**: Tursoによるグローバルな低レイテンシ
- **AIファースト**: LLMを中核としたインテリジェントな処理パイプライン

### 1.2 アーキテクチャの設計原則

1. **スケーラビリティファースト**: 水平スケーリングを前提とした設計
2. **フォールトトレランス**: 単一障害点を排除した冗長構成
3. **データ整合性**: 分散トランザクションとイベントソーシングの活用
4. **セキュリティバイデザイン**: ゼロトラストアーキテクチャの採用
5. **オブザーバビリティ**: 包括的なモニタリングとトレーシング

### 1.3 技術スタック選定理由

| 技術 | 選定理由 | エンタープライズ対応 |
|------|----------|---------------------|
| Next.js 14 | React 19の過渡期リスク回避、LTSサポート | ✅ |
| Capacitor | iOSバックグラウンド録音の必須要件 | ✅ |
| Turso | DiskANN Vector Search、グローバルレプリケーション | ✅ |
| tRPC | 型安全なエンドツーエンド通信 | ✅ |
| OpenAI Structured Outputs | 100%型安全なAI出力 | ✅ |

### 1.4 システム規模とパフォーマンス目標

- **同時ユーザー数**: 10,000ユーザー（初期）、100,000ユーザー（拡張時）
- **レイテンシ**: API応答 < 200ms（P95）、< 500ms（P99）
- **可用性**: 99.9% SLA（年間ダウンタイム < 8.76時間）
- **データ処理**: 1時間あたり100万件の音声処理、10万件の議事録生成

---

## 2. アーキテクチャ詳解

### 2.1 システム全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                    Global Load Balancer (Cloudflare)             │
│                    DDoS Protection + WAF + CDN                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway Layer (Kong/AWS API Gateway)     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Rate Limit  │  │ Auth Service │  │ Request Log   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer (Next.js Edge Functions)   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Frontend (Next.js 14 + React 18)                       │  │
│  │  - Server Components (SSR/SSG)                           │  │
│  │  - Client Components (Interactivity)                      │  │
│  │  - Edge Runtime (Global Distribution)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Routes (tRPC + REST)                               │  │
│  │  - Authentication (BetterAuth)                           │  │
│  │  - Business Logic (Server Actions)                       │  │
│  │  - File Upload (Multipart Handling)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Microservices Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Audio        │  │ AI Processing │  │ Notification│          │
│  │ Processing   │  │ Service       │  │ Service     │          │
│  │ Service      │  │               │  │             │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Vector       │  │ Content      │  │ Integration  │          │
│  │ Search       │  │ Generation   │  │ Service      │          │
│  │ Service      │  │ Service      │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Message Queue (RabbitMQ / AWS SQS)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Audio Queue  │  │ AI Queue     │  │ Event Queue  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Turso (LibSQL) - Primary Database                        │  │
│  │  - DiskANN Vector Index (ベクトル検索)                  │  │
│  │  - FTS5 Full-Text Search (全文検索)                      │  │
│  │  - Global Replication (低レイテンシ)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ S3 Compatible Storage (MinIO / AWS S3)                  │  │
│  │  - Audio Files (音声ファイル)                           │  │
│  │  - Waveform Data (波形データ)                            │  │
│  │  - Generated Content (生成コンテンツ)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Redis Cluster (Cache + Session Store)                   │  │
│  │  - Session Management                                    │  │
│  │  - Rate Limiting                                         │  │
│  │  - Real-time Data                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ OpenAI   │ │ Notion   │ │ Slack    │ │ Google   │           │
│  │ Whisper  │ │ API      │ │ API      │ │ OAuth    │           │
│  │ GPT-4    │ │          │ │          │ │          │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 レイヤー別アーキテクチャ詳細

#### 2.2.1 プレゼンテーション層（Frontend）

**Next.js 14 App Router構成**:

```
app/
├── (auth)/
│   └── login/
│       └── page.tsx          # 認証ページ
├── (dashboard)/
│   ├── layout.tsx            # ダッシュボードレイアウト
│   ├── page.tsx              # ホーム画面
│   ├── record/
│   │   └── page.tsx          # 録音画面
│   ├── chat/
│   │   └── page.tsx          # AIチャット
│   └── projects/
│       └── [id]/
│           └── page.tsx      # プロジェクト詳細
├── api/
│   ├── trpc/
│   │   └── [trpc]/
│   │       └── route.ts      # tRPCエンドポイント
│   ├── recordings/
│   │   └── upload/
│   │       └── route.ts      # 録音アップロード
│   └── webhooks/
│       └── route.ts          # Webhook受信
└── layout.tsx                # ルートレイアウト
```

**Server Components vs Client Components戦略**:

- **Server Components**: データフェッチ、SEO重要ページ、静的コンテンツ
- **Client Components**: インタラクティブUI、フォーム、リアルタイム更新

#### 2.2.2 アプリケーション層（Backend）

**tRPC Router構成**:

```typescript
// server/routers/_app.ts
export const appRouter = router({
  // 認証
  auth: authRouter,
  
  // プロジェクト管理
  project: projectRouter,
  
  // 録音・議事録
  recording: recordingRouter,
  meetingNote: meetingNoteRouter,
  
  // タスク管理
  task: taskRouter,
  taskCandidate: taskCandidateRouter,
  
  // AI機能
  ai: aiRouter,
  
  // ファイル管理
  file: fileRouter,
  
  // フォルダ管理
  folder: folderRouter,
  
  // コンテキスト管理
  context: contextRouter,
  
  // 外部連携
  integration: integrationRouter,
  
  // コンテンツ生成
  content: contentRouter,
});
```

**Server Actionsパターン**:

```typescript
// server/actions/recording.ts
'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { recordings } from '@/db/schema';

export async function uploadRecording(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  
  const audioFile = formData.get('audio') as File;
  // バリデーション、アップロード処理...
  
  return { success: true, recordingId: newRecording.id };
}
```

#### 2.2.3 マイクロサービス層

**サービス間通信パターン**:

1. **同期通信**: gRPC（低レイテンシが必要な場合）
2. **非同期通信**: RabbitMQ / AWS SQS（イベント駆動）
3. **サービスメッシュ**: Istio（トラフィック管理、セキュリティ）

**各マイクロサービスの責務**:

- **Audio Processing Service**: FFmpeg処理、音声分割、波形生成
- **AI Processing Service**: Whisper文字起こし、GPT-4議事録生成、タスク抽出
- **Vector Search Service**: ベクトル検索、ハイブリッド検索
- **Notification Service**: プッシュ通知、メール送信、Slack連携

### 2.3 データフロー設計

#### 2.3.1 録音→議事録生成フロー

```
1. クライアント（Capacitor App）
   ↓ 録音データアップロード
2. API Gateway
   ↓ 認証・レート制限
3. Next.js API Route
   ↓ S3に保存
4. Message Queue (Audio Queue)
   ↓ 非同期処理
5. Audio Processing Service
   ↓ FFmpeg分割
6. AI Processing Service
   ↓ Whisper API呼び出し
7. AI Processing Service
   ↓ GPT-4議事録生成
8. Database (Turso)
   ↓ 保存
9. WebSocket / SSE
   ↓ リアルタイム通知
10. クライアント（UI更新）
```

#### 2.3.2 イベント駆動アーキテクチャ

```typescript
// イベント定義
export const Events = {
  RECORDING_UPLOADED: 'recording.uploaded',
  TRANSCRIPTION_COMPLETED: 'transcription.completed',
  MEETING_NOTE_GENERATED: 'meeting_note.generated',
  TASK_EXTRACTED: 'task.extracted',
  CONTENT_SUGGESTED: 'content.suggested',
} as const;

// イベントハンドラー
export const eventHandlers = {
  [Events.RECORDING_UPLOADED]: async (event: RecordingUploadedEvent) => {
    // 音声処理を開始
    await audioProcessingService.process(event.recordingId);
  },
  
  [Events.TRANSCRIPTION_COMPLETED]: async (event: TranscriptionCompletedEvent) => {
    // 議事録生成を開始
    await aiProcessingService.generateMeetingNote(event.transcriptionId);
  },
  
  // ...
};
```

### 2.4 セキュリティアーキテクチャ

#### 2.4.1 ゼロトラストモデル

- **認証**: すべてのリクエストで認証を要求
- **認可**: リソース単位での権限チェック
- **暗号化**: 転送時（TLS 1.3）と保存時（AES-256）
- **監査ログ**: すべての操作を記録

#### 2.4.2 セキュリティレイヤー

```
1. WAF (Web Application Firewall)
   - SQLインジェクション対策
   - XSS対策
   - DDoS対策

2. API Gateway
   - レート制限
   - 認証トークン検証
   - IPホワイトリスト

3. Application Layer
   - 入力バリデーション
   - 出力サニタイゼーション
   - CSRF対策

4. Database Layer
   - Row-Level Security
   - 暗号化カラム
   - 監査ログ
```

---

## 3. 実装パターンとベストプラクティス

### 3.1 マイクロサービスパターン

#### 3.1.1 サービス間通信パターン

**同期通信（gRPC）**:

```typescript
// proto/audio_processing.proto
syntax = "proto3";

service AudioProcessingService {
  rpc ProcessAudio(ProcessAudioRequest) returns (ProcessAudioResponse);
  rpc GetStatus(GetStatusRequest) returns (GetStatusResponse);
}

message ProcessAudioRequest {
  string recording_id = 1;
  string s3_key = 2;
}

message ProcessAudioResponse {
  string job_id = 1;
  string status = 2;
}
```

**非同期通信（RabbitMQ）**:

```typescript
// server/services/event-bus.ts
import amqp from 'amqplib';

export class EventBus {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async connect() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL!);
    this.channel = await this.connection.createChannel();
    
    // エクスチェンジを宣言
    await this.channel.assertExchange('actory.events', 'topic', {
      durable: true,
    });
  }

  async publish(event: string, data: any) {
    await this.channel.publish('actory.events', event, Buffer.from(JSON.stringify(data)), {
      persistent: true,
    });
  }

  async subscribe(event: string, handler: (data: any) => Promise<void>) {
    const queue = await this.channel.assertQueue('', { exclusive: true });
    await this.channel.bindQueue(queue.queue, 'actory.events', event);
    
    await this.channel.consume(queue.queue, async (msg) => {
      if (msg) {
        const data = JSON.parse(msg.content.toString());
        await handler(data);
        this.channel.ack(msg);
      }
    });
  }
}
```

#### 3.1.2 サービスディスカバリ

**Consul / Eurekaパターン**:

```typescript
// server/services/service-discovery.ts
import { Consul } from 'consul';

export class ServiceDiscovery {
  private consul: Consul;

  constructor() {
    this.consul = new Consul({
      host: process.env.CONSUL_HOST || 'localhost',
      port: process.env.CONSUL_PORT || '8500',
    });
  }

  async registerService(service: {
    name: string;
    address: string;
    port: number;
    health: string;
  }) {
    await this.consul.agent.service.register({
      name: service.name,
      address: service.address,
      port: service.port,
      check: {
        http: service.health,
        interval: '10s',
      },
    });
  }

  async discoverService(serviceName: string) {
    const services = await this.consul.health.service({
      service: serviceName,
      passing: true,
    });
    
    // ロードバランシング（ラウンドロビン）
    return this.selectService(services);
  }
}
```

### 3.2 データベースパターン

#### 3.2.1 CQRS（Command Query Responsibility Segregation）

```typescript
// Command側（書き込み）
export class CommandHandler {
  async createMeetingNote(command: CreateMeetingNoteCommand) {
    // イベントを発行
    await eventStore.append({
      aggregateId: command.id,
      eventType: 'MeetingNoteCreated',
      data: command,
    });
  }
}

// Query側（読み取り）
export class QueryHandler {
  async getMeetingNote(id: number) {
    // 読み取り専用の最適化されたクエリ
    return await db.query.meetingNotes.findFirst({
      where: eq(meetingNotes.id, id),
      with: {
        project: true,
        file: true,
      },
    });
  }
}
```

#### 3.2.2 イベントソーシング

```typescript
// server/event-store.ts
export class EventStore {
  async append(event: DomainEvent) {
    await db.insert(eventStore).values({
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      data: JSON.stringify(event.data),
      version: await this.getNextVersion(event.aggregateId),
      timestamp: new Date(),
    });
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const events = await db
      .select()
      .from(eventStore)
      .where(eq(eventStore.aggregateId, aggregateId))
      .orderBy(asc(eventStore.version));
    
    return events.map(e => ({
      aggregateId: e.aggregateId,
      eventType: e.eventType,
      data: JSON.parse(e.data),
      version: e.version,
    }));
  }

  async rebuildAggregate(aggregateId: string) {
    const events = await this.getEvents(aggregateId);
    let aggregate = new MeetingNoteAggregate();
    
    for (const event of events) {
      aggregate.apply(event);
    }
    
    return aggregate;
  }
}
```

### 3.3 キャッシング戦略

#### 3.3.1 マルチレイヤーキャッシュ

```typescript
// server/cache/multi-layer-cache.ts
export class MultiLayerCache {
  private l1Cache: Map<string, any>; // インメモリキャッシュ
  private l2Cache: Redis; // Redisキャッシュ
  private l3Cache: Database; // データベース

  async get<T>(key: string): Promise<T | null> {
    // L1: インメモリ
    if (this.l1Cache.has(key)) {
      return this.l1Cache.get(key);
    }

    // L2: Redis
    const l2Value = await this.l2Cache.get(key);
    if (l2Value) {
      this.l1Cache.set(key, l2Value);
      return l2Value;
    }

    // L3: データベース
    const l3Value = await this.l3Cache.query(key);
    if (l3Value) {
      await this.l2Cache.set(key, l3Value, { ttl: 3600 });
      this.l1Cache.set(key, l3Value);
      return l3Value;
    }

    return null;
  }

  async set(key: string, value: any, options?: { ttl?: number }) {
    this.l1Cache.set(key, value);
    await this.l2Cache.set(key, value, { ttl: options?.ttl || 3600 });
  }

  async invalidate(key: string) {
    this.l1Cache.delete(key);
    await this.l2Cache.del(key);
  }
}
```

#### 3.3.2 キャッシュインバリデーション戦略

```typescript
// Cache-asideパターン
export async function getMeetingNote(id: number) {
  const cacheKey = `meeting_note:${id}`;
  
  // キャッシュから取得を試みる
  let note = await cache.get(cacheKey);
  
  if (!note) {
    // キャッシュミス: データベースから取得
    note = await db.query.meetingNotes.findFirst({
      where: eq(meetingNotes.id, id),
    });
    
    // キャッシュに保存
    if (note) {
      await cache.set(cacheKey, note, { ttl: 3600 });
    }
  }
  
  return note;
}

// Write-throughパターン
export async function updateMeetingNote(id: number, data: Partial<MeetingNote>) {
  // データベースを更新
  await db.update(meetingNotes)
    .set(data)
    .where(eq(meetingNotes.id, id));
  
  // キャッシュも更新
  const updated = await db.query.meetingNotes.findFirst({
    where: eq(meetingNotes.id, id),
  });
  
  await cache.set(`meeting_note:${id}`, updated, { ttl: 3600 });
}
```

### 3.4 エラーハンドリングパターン

#### 3.4.1 リトライとサーキットブレーカー

```typescript
// server/utils/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        await sleep(delay);
        delay = Math.min(delay * factor, maxDelay);
      }
    }
  }

  throw lastError!;
}

// サーキットブレーカー
export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1分

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}
```

---

## 4. 詳細なコード実装例

### 4.1 マイクロサービス実装例

#### 4.1.1 Audio Processing Service

```typescript
// services/audio-processing/src/index.ts
import express from 'express';
import { AudioProcessor } from './audio-processor';
import { EventBus } from './event-bus';

const app = express();
app.use(express.json());

const audioProcessor = new AudioProcessor();
const eventBus = new EventBus();

// 音声処理エンドポイント
app.post('/process', async (req, res) => {
  const { recordingId, s3Key } = req.body;
  
  try {
    // 非同期処理を開始
    const jobId = await audioProcessor.process({
      recordingId,
      s3Key,
    });
    
    res.json({ jobId, status: 'processing' });
    
    // イベントを発行
    await eventBus.publish('audio.processing.started', {
      recordingId,
      jobId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ステータス確認エンドポイント
app.get('/status/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const status = await audioProcessor.getStatus(jobId);
  res.json(status);
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(3001, () => {
  console.log('Audio Processing Service listening on port 3001');
});
```

```typescript
// services/audio-processing/src/audio-processor.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { splitAudioBySilence } from './ffmpeg-utils';

const execAsync = promisify(exec);

export class AudioProcessor {
  private s3Client: S3Client;
  private jobs: Map<string, ProcessingJob> = new Map();

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async process(options: { recordingId: string; s3Key: string }): Promise<string> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.jobs.set(jobId, {
      id: jobId,
      recordingId: options.recordingId,
      status: 'processing',
      progress: 0,
      createdAt: new Date(),
    });

    // 非同期で処理を実行
    this.processAsync(jobId, options).catch(error => {
      console.error(`Job ${jobId} failed:`, error);
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error.message;
      }
    });

    return jobId;
  }

  private async processAsync(jobId: string, options: { recordingId: string; s3Key: string }) {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');

    try {
      // 1. S3から音声ファイルをダウンロード
      job.progress = 10;
      const audioBuffer = await this.downloadFromS3(options.s3Key);

      // 2. 一時ファイルに保存
      const tempPath = `/tmp/${jobId}.mp3`;
      await fs.writeFile(tempPath, audioBuffer);

      // 3. FFmpegで無音検知分割
      job.progress = 30;
      const chunks = await splitAudioBySilence(tempPath);

      // 4. 各チャンクをS3にアップロード
      job.progress = 50;
      const chunkKeys = await Promise.all(
        chunks.map((chunk, index) => this.uploadChunk(chunk, options.recordingId, index))
      );

      // 5. 波形データを生成
      job.progress = 70;
      const waveformData = await this.generateWaveform(tempPath);

      // 6. 完了
      job.progress = 100;
      job.status = 'completed';
      job.result = {
        chunks: chunkKeys,
        waveform: waveformData,
      };

      // イベントを発行
      await this.eventBus.publish('audio.processing.completed', {
        recordingId: options.recordingId,
        jobId,
        chunks: chunkKeys,
        waveform: waveformData,
      });
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      throw error;
    }
  }

  async getStatus(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');
    
    return {
      id: job.id,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
    };
  }

  private async downloadFromS3(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    });
    
    const response = await this.s3Client.send(command);
    const chunks: Uint8Array[] = [];
    
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }
}
```

#### 4.1.2 AI Processing Service

```typescript
// services/ai-processing/src/index.ts
import express from 'express';
import { AIService } from './ai-service';
import { EventBus } from './event-bus';

const app = express();
app.use(express.json());

const aiService = new AIService();
const eventBus = new EventBus();

// イベント購読: 文字起こし完了を待つ
eventBus.subscribe('transcription.completed', async (event) => {
  const { transcriptionId, transcription } = event;
  
  try {
    // 議事録生成を開始
    const meetingNote = await aiService.generateMeetingNote({
      transcriptionId,
      transcription,
      userId: event.userId,
      projectId: event.projectId,
    });
    
    // イベントを発行
    await eventBus.publish('meeting_note.generated', {
      meetingNoteId: meetingNote.id,
      transcriptionId,
    });
  } catch (error) {
    console.error('Failed to generate meeting note:', error);
  }
});

app.listen(3002, () => {
  console.log('AI Processing Service listening on port 3002');
});
```

```typescript
// services/ai-processing/src/ai-service.ts
import { OpenAI } from 'openai';
import { db } from '@shared/database';

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  async generateMeetingNote(options: {
    transcriptionId: number;
    transcription: string;
    userId: number;
    projectId: number;
  }) {
    // Structured Outputsで議事録を生成
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `あなたはプロフェッショナルな議事録生成AIです。
情報を一切省略せず、構造化によって読みやすくしてください。`,
        },
        {
          role: 'user',
          content: `以下の文字起こしから議事録を生成してください:\n\n${options.transcription}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'meeting_note',
          schema: meetingNoteSchema,
          strict: true,
        },
      },
    });

    const result = JSON.parse(completion.choices[0].message.content!);

    // データベースに保存
    const meetingNote = await db.insert(meetingNotes).values({
      userId: options.userId,
      projectId: options.projectId,
      title: result.title,
      summary: result.summary,
      agendaItems: JSON.stringify(result.agendaItems),
      discussionDetails: result.discussionDetails,
      decisions: JSON.stringify(result.decisions),
      actionItems: JSON.stringify(result.actionItems),
      formattedMinutes: this.formatAsMarkdown(result),
    });

    return meetingNote;
  }

  async extractTasks(meetingNoteId: number) {
    const note = await db.query.meetingNotes.findFirst({
      where: eq(meetingNotes.id, meetingNoteId),
    });

    if (!note) throw new Error('Meeting note not found');

    // Function Callingでタスクを抽出
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '会議の内容から具体的なタスクを抽出してください。',
        },
        {
          role: 'user',
          content: note.formattedMinutes,
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'create_task',
            description: 'タスクを作成します',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                dueDate: { type: 'string', format: 'date' },
                priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              },
              required: ['title', 'description'],
            },
          },
        },
      ],
      tool_choice: 'required',
    });

    const toolCalls = completion.choices[0].message.tool_calls || [];
    const tasks = toolCalls.map(call => JSON.parse(call.function.arguments));

    // タスク候補として保存
    for (const task of tasks) {
      await db.insert(taskCandidates).values({
        userId: note.userId,
        recordingId: note.recordingId,
        title: task.title,
        description: task.description,
        suggestedDueDate: task.dueDate ? new Date(task.dueDate).getTime() : null,
        suggestedPriority: task.priority || 'medium',
      });
    }

    return tasks;
  }

  private formatAsMarkdown(data: any): string {
    return `# ${data.title}

## 要約
${data.summary}

## 議題
${data.agendaItems.map((item: string) => `- ${item}`).join('\n')}

## 議論内容
${data.discussionDetails}

## 決定事項
${data.decisions.map((d: any) => `- **${d.item}**: ${d.details || ''}`).join('\n')}

## アクションアイテム
${data.actionItems.map((a: any) => `- ${a.title} (${a.priority || 'medium'})`).join('\n')}
`;
  }
}
```

### 4.2 データベース実装例

#### 4.2.1 Turso Vector Search実装

```typescript
// server/lib/vector-search.ts
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export class VectorSearchService {
  // ベクトル埋め込みを生成して保存
  async indexKnowledge(knowledgeId: number, content: string) {
    // OpenAI Embeddings APIでベクトルを生成
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: content,
    });

    const vector = embedding.data[0].embedding;

    // Tursoに保存（DiskANNインデックスを使用）
    await db.execute(sql`
      INSERT INTO knowledge_embeddings (id, embedding, content)
      VALUES (${knowledgeId}, ${JSON.stringify(vector)}, ${content})
      ON CONFLICT(id) DO UPDATE SET
        embedding = ${JSON.stringify(vector)},
        content = ${content}
    `);
  }

  // 類似ナレッジを検索
  async searchSimilar(
    query: string,
    limit: number = 5
  ): Promise<Array<{ id: number; content: string; distance: number }>> {
    // クエリをベクトル化
    const queryEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: query,
    });

    const queryVector = queryEmbedding.data[0].embedding;

    // DiskANNで類似検索
    const results = await db.execute(sql`
      SELECT 
        id,
        content,
        vector_distance(embedding, ${JSON.stringify(queryVector)}) as distance
      FROM knowledge_embeddings
      ORDER BY distance ASC
      LIMIT ${limit}
    `);

    return results as any;
  }

  // ハイブリッド検索（ベクトル + 全文検索）
  async hybridSearch(
    query: string,
    limit: number = 5
  ): Promise<Array<{ id: number; content: string; score: number }>> {
    // ベクトル検索
    const vectorResults = await this.searchSimilar(query, limit * 2);
    
    // 全文検索（FTS5）
    const ftsResults = await db.execute(sql`
      SELECT 
        id,
        content,
        rank
      FROM knowledge_fts
      WHERE knowledge_fts MATCH ${query}
      ORDER BY rank
      LIMIT ${limit * 2}
    `);

    // 結果をマージしてスコアリング
    const scoreMap = new Map<number, number>();
    
    // ベクトル検索のスコア（距離が小さいほど高スコア）
    vectorResults.forEach((result, index) => {
      const score = (1 / (1 + result.distance)) * (vectorResults.length - index);
      scoreMap.set(result.id, (scoreMap.get(result.id) || 0) + score);
    });
    
    // 全文検索のスコア
    (ftsResults as any[]).forEach((result, index) => {
      const score = (ftsResults.length - index) * 0.5;
      scoreMap.set(result.id, (scoreMap.get(result.id) || 0) + score);
    });
    
    // スコアでソート
    return Array.from(scoreMap.entries())
      .map(([id, score]) => ({
        id,
        score,
        content: [...vectorResults, ...ftsResults].find(r => r.id === id)?.content || '',
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
```

---

## 5. パフォーマンスチューニング

### 5.1 データベース最適化

#### 5.1.1 インデックス戦略

```sql
-- 複合インデックス
CREATE INDEX idx_meeting_notes_user_project_created 
ON meetingNotes(userId, projectId, createdAt DESC);

-- 部分インデックス（アクティブなタスクのみ）
CREATE INDEX idx_tasks_active_due_date 
ON tasks(dueDate ASC) 
WHERE status != 'completed';

-- カバリングインデックス（クエリに必要な全カラムを含む）
CREATE INDEX idx_files_project_parent_covering 
ON files(projectId, parentFileId) 
INCLUDE (id, name, fileType, createdAt);
```

#### 5.1.2 クエリ最適化

```typescript
// 悪い例: N+1クエリ
const projects = await db.query.projects.findMany();
for (const project of projects) {
  const files = await db.query.files.findMany({
    where: eq(files.projectId, project.id),
  });
}

// 良い例: JOINで一度に取得
const projectsWithFiles = await db
  .select()
  .from(projects)
  .leftJoin(files, eq(projects.id, files.projectId));
```

### 5.2 フロントエンド最適化

#### 5.2.1 コード分割とレイジーローディング

```typescript
// app/(dashboard)/projects/[id]/page.tsx
import dynamic from 'next/dynamic';

// 重いコンポーネントを動的インポート
const GraphView = dynamic(() => import('@/components/graph/sigma-graph-view'), {
  loading: () => <GraphViewSkeleton />,
  ssr: false, // クライアント側のみでレンダリング
});

const FolderTree = dynamic(() => import('@/components/file/folder-tree'), {
  loading: () => <FolderTreeSkeleton />,
});
```

#### 5.2.2 画像最適化

```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['s3.amazonaws.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

### 5.3 キャッシング戦略

#### 5.3.1 Next.jsキャッシング

```typescript
// app/(dashboard)/projects/page.tsx
export const revalidate = 3600; // 1時間ごとに再検証

export default async function ProjectsPage() {
  // このデータは1時間キャッシュされる
  const projects = await db.query.projects.findMany();
  
  return <ProjectsList projects={projects} />;
}
```

#### 5.3.2 React Queryキャッシング

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
    },
  },
});
```

---

## 6. トラブルシューティングガイド

### 6.1 よくある問題と解決策

#### 6.1.1 データベース接続エラー

**症状**: `ECONNREFUSED` エラー

**原因**: Tursoへの接続が確立できない

**解決策**:
```typescript
// lib/db.ts
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
  syncUrl: process.env.TURSO_SYNC_URL, // フォールバック用
});

// 接続プール設定
const pool = {
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
};
```

#### 6.1.2 メモリリーク

**症状**: 長時間実行でメモリ使用量が増加

**原因**: イベントリスナーの未解除、タイマーの未クリア

**解決策**:
```typescript
// useEffectのクリーンアップ
useEffect(() => {
  const subscription = eventBus.subscribe('event', handler);
  
  return () => {
    subscription.unsubscribe();
  };
}, []);

// タイマーのクリーンアップ
useEffect(() => {
  const interval = setInterval(() => {
    // 処理
  }, 1000);
  
  return () => clearInterval(interval);
}, []);
```

### 6.2 パフォーマンス問題の診断

#### 6.2.1 プロファイリングツール

```typescript
// server/middleware/profiler.ts
export function profileMiddleware(handler: Function) {
  return async (req: Request, res: Response) => {
    const start = performance.now();
    
    try {
      const result = await handler(req, res);
      const duration = performance.now() - start;
      
      // スロークエリをログに記録
      if (duration > 1000) {
        console.warn(`Slow request: ${req.url} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`Request failed after ${duration}ms:`, error);
      throw error;
    }
  };
}
```

---

## 7. 本番環境での考慮事項

### 7.1 デプロイメント戦略

- **ブルー・グリーンデプロイメント**: ダウンタイムゼロでのリリース
- **カナリアリリース**: 段階的なロールアウト
- **ロールバック計画**: 問題発生時の即座な復旧

### 7.2 モニタリングとアラート

- **APM**: Datadog / New Relic
- **ログ集約**: ELK Stack / Loki
- **メトリクス**: Prometheus + Grafana
- **アラート**: PagerDuty / Opsgenie

---

## 8. 自動実装プロンプト

### 🤖 自動実装プロンプト

このドキュメントを読み込んだAIは、以下のタスクを自動実行してください：

1. **依存関係の解決**
```bash
# 必要なパッケージを全て自動インストール
npm install express amqplib @aws-sdk/client-s3 @libsql/client drizzle-orm
npm install @tanstack/react-query @capacitor/core @capacitor/ios
npm install openai @types/node
```

2. **ファイル構造の生成**
```javascript
// 自動生成するファイルリスト
const filesToGenerate = [
  'services/audio-processing/src/index.ts',
  'services/audio-processing/src/audio-processor.ts',
  'services/ai-processing/src/index.ts',
  'services/ai-processing/src/ai-service.ts',
  'server/lib/vector-search.ts',
  'server/middleware/profiler.ts',
  // ... 全ファイルリスト
];
```

3. **実装コードの自動生成**
   各セクションのコード例を統合し、完全に動作するコードを生成

4. **テストの自動作成**
   各機能に対するユニットテスト、統合テスト、E2Eテストを生成

5. **ドキュメントの相互参照**
   他のドキュメントとの整合性を確認し、矛盾を自動修正

---

## 🌐 必須参照リソース（最低10個）

### 公式ドキュメント（5個以上）

1. [Next.js 14 Documentation](https://nextjs.org/docs) - メイン公式サイト
2. [tRPC Documentation](https://trpc.io/docs) - 完全なAPIドキュメント
3. [Turso Documentation](https://docs.turso.tech) - データベース設計原則
4. [Capacitor Documentation](https://capacitorjs.com/docs) - モバイルアプリ開発
5. [OpenAI API Reference](https://platform.openai.com/docs) - AI機能実装

### 実装記事・チュートリアル（5個以上）

6. [Netflix Microservices Architecture](https://netflixtechblog.com/) - 大規模マイクロサービス実装事例
7. [Google Cloud Architecture Patterns](https://cloud.google.com/architecture) - エンタープライズアーキテクチャ
8. [Microsoft Azure Best Practices](https://docs.microsoft.com/azure/architecture/) - セキュリティとスケーラビリティ
9. [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/) - クラウド設計原則
10. [Uber Engineering Blog](https://eng.uber.com/) - 大規模システムの実装経験

### 追加リソース（ボーナス）

11. [Martin Fowler - Microservices](https://martinfowler.com/articles/microservices.html) - マイクロサービスパターン
12. [The Twelve-Factor App](https://12factor.net/) - クラウドネイティブアプリ設計
13. [Site Reliability Engineering Book](https://sre.google/books/) - SRE実践ガイド
14. [High Scalability Blog](http://highscalability.com/) - スケーラビリティ事例
15. [InfoQ Architecture Articles](https://www.infoq.com/architecture-design/) - アーキテクチャ最新動向

---

**推定実装時間**: 4-6週間（エンタープライズグレード実装）

**次のステップ**: `MICROSERVICES_ORCHESTRATION.md` を参照してマイクロサービス間のオーケストレーションを実装してください。

