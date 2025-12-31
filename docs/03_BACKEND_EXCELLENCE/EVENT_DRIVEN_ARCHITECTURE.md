# イベント駆動アーキテクチャ完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: Node.js + RabbitMQ + Event Sourcing

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [イベント駆動アーキテクチャ詳解](#2-イベント駆動アーキテクチャ詳解)
3. [実装パターンとベストプラクティス](#3-実装パターンとベストプラクティス)
4. [詳細なコード実装例](#4-詳細なコード実装例)
5. [パフォーマンスチューニング](#5-パフォーマンスチューニング)
6. [トラブルシューティングガイド](#6-トラブルシューティングガイド)

---

## 1. エグゼクティブサマリー

### 1.1 イベント駆動アーキテクチャの概要

イベント駆動アーキテクチャ（EDA）は、システム内のコンポーネントがイベントを介して非同期に通信するアーキテクチャパターンです。

### 1.2 Actoryでの適用

- **録音アップロード**: 録音完了イベント → 文字起こし開始
- **文字起こし完了**: 文字起こし完了イベント → 議事録生成開始
- **議事録生成**: 議事録生成完了イベント → タスク抽出開始
- **通知**: 各イベント → ユーザー通知

### 1.3 利点

- **疎結合**: サービス間の直接依存を排除
- **スケーラビリティ**: 非同期処理による高いスループット
- **拡張性**: 新しいイベントハンドラーを簡単に追加
- **回復性**: イベントの再処理による障害回復

---

## 2. イベント駆動アーキテクチャ詳解

### 2.1 イベントフロー

```
┌─────────────────┐
│  録音アップロード │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  recording.uploaded     │
│  (Event Bus)            │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│ Audio  │ │ Notification  │
│Process │ │ Service      │
└───┬────┘ └──────────────┘
    │
    ▼
┌─────────────────────────┐
│ transcription.completed │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  AI Processing Service  │
└─────────────────────────┘
```

### 2.2 イベント定義

```typescript
// server/events/types.ts
export interface BaseEvent {
  id: string;
  type: string;
  timestamp: Date;
  userId: number;
  metadata?: Record<string, any>;
}

export interface RecordingUploadedEvent extends BaseEvent {
  type: 'recording.uploaded';
  data: {
    recordingId: number;
    s3Key: string;
    fileName: string;
    fileSize: number;
    duration?: number;
  };
}

export interface TranscriptionCompletedEvent extends BaseEvent {
  type: 'transcription.completed';
  data: {
    transcriptionId: number;
    recordingId: number;
    transcription: string;
    language: string;
    duration: number;
  };
}

export interface MeetingNoteGeneratedEvent extends BaseEvent {
  type: 'meeting_note.generated';
  data: {
    meetingNoteId: number;
    transcriptionId: number;
    title: string;
    summary: string;
  };
}

export interface TaskExtractedEvent extends BaseEvent {
  type: 'task.extracted';
  data: {
    taskCandidateIds: number[];
    meetingNoteId: number;
  };
}

export type DomainEvent =
  | RecordingUploadedEvent
  | TranscriptionCompletedEvent
  | MeetingNoteGeneratedEvent
  | TaskExtractedEvent;
```

---

## 3. 実装パターンとベストプラクティス

### 3.1 イベントバス実装

```typescript
// server/events/event-bus.ts
import amqp from 'amqplib';
import { DomainEvent } from './types';

export class EventBus {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private exchangeName = 'actory.events';

  async connect() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL!);
    this.channel = await this.connection.createChannel();
    
    // トピックエクスチェンジを宣言
    await this.channel.assertExchange(this.exchangeName, 'topic', {
      durable: true,
    });
  }

  async publish(event: DomainEvent) {
    if (!this.channel) {
      throw new Error('EventBus not connected');
    }

    await this.channel.publish(
      this.exchangeName,
      event.type,
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        messageId: event.id,
        timestamp: event.timestamp.getTime(),
        headers: {
          userId: event.userId.toString(),
        },
      }
    );
  }

  async subscribe(
    eventType: string,
    handler: (event: DomainEvent) => Promise<void>
  ) {
    if (!this.channel) {
      throw new Error('EventBus not connected');
    }

    // キューを宣言
    const queue = await this.channel.assertQueue('', {
      exclusive: true,
      durable: false,
    });

    // エクスチェンジにバインド
    await this.channel.bindQueue(queue.queue, this.exchangeName, eventType);

    // メッセージを消費
    await this.channel.consume(queue.queue, async (msg) => {
      if (msg) {
        try {
          const event = JSON.parse(msg.content.toString()) as DomainEvent;
          await handler(event);
          this.channel!.ack(msg);
        } catch (error) {
          console.error(`Error processing event:`, error);
          // エラー時はNACK（再キュー）
          this.channel!.nack(msg, false, true);
        }
      }
    });
  }

  async close() {
    await this.channel?.close();
    await this.connection?.close();
  }
}

// シングルトンインスタンス
export const eventBus = new EventBus();
```

### 3.2 イベントハンドラー実装

```typescript
// server/events/handlers/transcription-handler.ts
import { eventBus } from '../event-bus';
import { TranscriptionCompletedEvent } from '../types';
import { aiProcessingService } from '@/server/services/ai-processing';

export class TranscriptionEventHandler {
  async initialize() {
    // 文字起こし完了イベントを購読
    await eventBus.subscribe(
      'transcription.completed',
      this.handleTranscriptionCompleted.bind(this)
    );
  }

  private async handleTranscriptionCompleted(
    event: TranscriptionCompletedEvent
  ) {
    const { transcriptionId, transcription, recordingId } = event.data;

    try {
      // 議事録生成を開始
      const meetingNote = await aiProcessingService.generateMeetingNote({
        transcriptionId,
        transcription,
        userId: event.userId,
        recordingId,
      });

      // 議事録生成完了イベントを発行
      await eventBus.publish({
        id: crypto.randomUUID(),
        type: 'meeting_note.generated',
        timestamp: new Date(),
        userId: event.userId,
        data: {
          meetingNoteId: meetingNote.id,
          transcriptionId,
          title: meetingNote.title,
          summary: meetingNote.summary,
        },
      });
    } catch (error) {
      console.error('Failed to generate meeting note:', error);
      // エラーイベントを発行
      await eventBus.publish({
        id: crypto.randomUUID(),
        type: 'meeting_note.generation_failed',
        timestamp: new Date(),
        userId: event.userId,
        data: {
          transcriptionId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}
```

### 3.3 イベントストア実装

```typescript
// server/events/event-store.ts
import { db } from '@/db';
import { eventStore } from '@/db/schema';
import { DomainEvent } from './types';
import { eq, asc } from 'drizzle-orm';

export class EventStore {
  async append(event: DomainEvent) {
    await db.insert(eventStore).values({
      id: event.id,
      eventType: event.type,
      aggregateId: this.extractAggregateId(event),
      data: JSON.stringify(event.data),
      metadata: JSON.stringify(event.metadata || {}),
      userId: event.userId,
      timestamp: event.timestamp,
      version: await this.getNextVersion(this.extractAggregateId(event)),
    });
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const events = await db
      .select()
      .from(eventStore)
      .where(eq(eventStore.aggregateId, aggregateId))
      .orderBy(asc(eventStore.version));

    return events.map((e) => ({
      id: e.id,
      type: e.eventType,
      timestamp: e.timestamp,
      userId: e.userId,
      data: JSON.parse(e.data),
      metadata: JSON.parse(e.metadata || '{}'),
    })) as DomainEvent[];
  }

  private extractAggregateId(event: DomainEvent): string {
    // イベントタイプに応じて集約IDを抽出
    if ('recordingId' in event.data) {
      return `recording:${event.data.recordingId}`;
    }
    if ('transcriptionId' in event.data) {
      return `transcription:${event.data.transcriptionId}`;
    }
    if ('meetingNoteId' in event.data) {
      return `meeting_note:${event.data.meetingNoteId}`;
    }
    return `unknown:${event.id}`;
  }

  private async getNextVersion(aggregateId: string): Promise<number> {
    const lastEvent = await db
      .select()
      .from(eventStore)
      .where(eq(eventStore.aggregateId, aggregateId))
      .orderBy(desc(eventStore.version))
      .limit(1);

    return lastEvent.length > 0 ? lastEvent[0].version + 1 : 1;
  }
}

export const eventStore = new EventStore();
```

---

## 4. 詳細なコード実装例

### 4.1 録音アップロードイベント発行

```typescript
// app/api/recordings/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadToS3 } from '@/server/services/storage';
import { eventBus } from '@/server/events/event-bus';
import { db } from '@/db';
import { recordings } from '@/db/schema';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const audioFile = formData.get('audio') as File;
  const projectId = parseInt(formData.get('projectId') as string);

  // S3にアップロード
  const s3Key = await uploadToS3(audioFile, session.user.id);

  // データベースに記録
  const recording = await db.insert(recordings).values({
    userId: session.user.id,
    projectId,
    fileName: audioFile.name,
    fileSize: audioFile.size,
    s3Key,
    status: 'uploaded',
  }).returning();

  // イベントを発行
  await eventBus.publish({
    id: crypto.randomUUID(),
    type: 'recording.uploaded',
    timestamp: new Date(),
    userId: session.user.id,
    data: {
      recordingId: recording[0].id,
      s3Key,
      fileName: audioFile.name,
      fileSize: audioFile.size,
    },
  });

  return NextResponse.json({ recordingId: recording[0].id });
}
```

### 4.2 音声処理サービス

```typescript
// server/services/audio-processing.ts
import { eventBus } from '@/server/events/event-bus';
import { RecordingUploadedEvent } from '@/server/events/types';
import { downloadFromS3 } from '@/server/services/storage';
import { splitAudioBySilence } from '@/server/utils/ffmpeg';
import { transcribeAudio } from '@/server/services/whisper';

export class AudioProcessingService {
  async initialize() {
    await eventBus.subscribe(
      'recording.uploaded',
      this.handleRecordingUploaded.bind(this)
    );
  }

  private async handleRecordingUploaded(event: RecordingUploadedEvent) {
    const { recordingId, s3Key } = event.data;

    try {
      // S3から音声ファイルをダウンロード
      const audioBuffer = await downloadFromS3(s3Key);

      // FFmpegで無音検知分割
      const chunks = await splitAudioBySilence(audioBuffer);

      // 各チャンクを文字起こし
      const transcriptions = await Promise.all(
        chunks.map((chunk) => transcribeAudio(chunk))
      );

      // 文字起こし結果を結合
      const fullTranscription = transcriptions.join('\n');

      // データベースに保存
      const transcription = await db.insert(transcriptions).values({
        recordingId,
        transcription: fullTranscription,
        status: 'completed',
      }).returning();

      // 文字起こし完了イベントを発行
      await eventBus.publish({
        id: crypto.randomUUID(),
        type: 'transcription.completed',
        timestamp: new Date(),
        userId: event.userId,
        data: {
          transcriptionId: transcription[0].id,
          recordingId,
          transcription: fullTranscription,
          language: 'ja',
          duration: chunks.reduce((sum, chunk) => sum + chunk.duration, 0),
        },
      });
    } catch (error) {
      console.error('Audio processing failed:', error);
      // エラーイベントを発行
      await eventBus.publish({
        id: crypto.randomUUID(),
        type: 'transcription.failed',
        timestamp: new Date(),
        userId: event.userId,
        data: {
          recordingId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}

export const audioProcessingService = new AudioProcessingService();
```

---

## 5. パフォーマンスチューニング

### 5.1 イベントのバッチ処理

```typescript
// server/events/batch-processor.ts
export class BatchEventProcessor {
  private batch: DomainEvent[] = [];
  private batchSize = 100;
  private flushInterval = 5000; // 5秒

  constructor(private handler: (events: DomainEvent[]) => Promise<void>) {
    setInterval(() => this.flush(), this.flushInterval);
  }

  async add(event: DomainEvent) {
    this.batch.push(event);
    
    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush() {
    if (this.batch.length === 0) return;

    const events = [...this.batch];
    this.batch = [];

    try {
      await this.handler(events);
    } catch (error) {
      console.error('Batch processing failed:', error);
      // エラー時は再キュー
      this.batch.unshift(...events);
    }
  }
}
```

### 5.2 イベントの優先度管理

```typescript
// server/events/priority-queue.ts
export class PriorityEventQueue {
  private queues: Map<string, DomainEvent[]> = new Map();

  enqueue(event: DomainEvent, priority: 'high' | 'medium' | 'low' = 'medium') {
    if (!this.queues.has(priority)) {
      this.queues.set(priority, []);
    }
    this.queues.get(priority)!.push(event);
  }

  dequeue(): DomainEvent | null {
    // 優先度順に処理
    for (const priority of ['high', 'medium', 'low']) {
      const queue = this.queues.get(priority);
      if (queue && queue.length > 0) {
        return queue.shift()!;
      }
    }
    return null;
  }
}
```

---

## 6. トラブルシューティングガイド

### 6.1 よくある問題

#### 問題1: イベントの重複処理

**解決策**: イベントIDによる冪等性チェック

```typescript
// server/events/idempotency.ts
const processedEvents = new Set<string>();

export async function processEventWithIdempotency(
  event: DomainEvent,
  handler: (event: DomainEvent) => Promise<void>
) {
  if (processedEvents.has(event.id)) {
    console.log(`Event ${event.id} already processed, skipping`);
    return;
  }

  await handler(event);
  processedEvents.add(event.id);
}
```

#### 問題2: イベントの順序保証

**解決策**: パーティションキーによる順序保証

```typescript
// RabbitMQでパーティションキーを使用
await channel.publish(
  exchangeName,
  event.type,
  Buffer.from(JSON.stringify(event)),
  {
    persistent: true,
    messageId: event.id,
    // 同じaggregateIdのイベントは同じキューにルーティング
    routingKey: `${event.type}.${aggregateId}`,
  }
);
```

---

## 🌐 必須参照リソース（最低10個）

### 公式ドキュメント（5個以上）

1. [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html) - RabbitMQ公式
2. [Event-Driven Architecture Patterns](https://martinfowler.com/articles/201701-event-driven.html) - Martin Fowler
3. [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) - Event Sourcingパターン
4. [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html) - CQRSパターン
5. [Domain Events](https://martinfowler.com/eaaDev/DomainEvent.html) - ドメインイベント

### 実装記事・チュートリアル（5個以上）

6. [Building Event-Driven Microservices](https://www.oreilly.com/library/view/building-event-driven-microservices/9781492057888/) - O'Reilly
7. [Event-Driven Architecture Best Practices](https://www.confluent.io/blog/event-driven-architecture-best-practices/) - Confluent
8. [RabbitMQ Patterns](https://www.rabbitmq.com/getstarted.html) - RabbitMQパターン
9. [Event Sourcing Implementation](https://eventstore.com/blog/event-sourcing-basics/) - EventStore
10. [Microservices Event Patterns](https://microservices.io/patterns/data/event-driven-architecture.html) - Microservices.io

---

**推定実装時間**: 3-4週間（完全なイベント駆動アーキテクチャ実装）

**次のステップ**: `CQRS_EVENT_SOURCING.md` を参照してCQRSとEvent Sourcingを実装してください。

