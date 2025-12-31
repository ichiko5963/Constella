# 分散トレーシング完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: OpenTelemetry + Jaeger + Zipkin

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [分散トレーシングアーキテクチャ](#2-分散トレーシングアーキテクチャ)
3. [実装パターン](#3-実装パターン)
4. [詳細なコード実装例](#4-詳細なコード実装例)

---

## 1. エグゼクティブサマリー

### 1.1 分散トレーシングとは

マイクロサービス間のリクエストフローを追跡し、パフォーマンスボトルネックを特定する技術です。

### 1.2 Actoryでの適用

- **リクエスト追跡**: 録音アップロードから議事録生成までのフロー
- **レイテンシ測定**: 各サービスの処理時間
- **エラー追跡**: エラー発生箇所の特定

---

## 2. 分散トレーシングアーキテクチャ

### 2.1 OpenTelemetry設定

```typescript
// server/instrumentation.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

### 2.2 カスタムトレース

```typescript
// server/lib/tracing.ts
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('actory-service');

export async function tracedFunction<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

---

## 3. 実装パターン

### 3.1 録音処理のトレーシング

```typescript
// server/services/audio-processing.ts
import { tracedFunction } from '@/server/lib/tracing';

export class AudioProcessingService {
  async processRecording(recordingId: number) {
    return tracedFunction('audio.process', async () => {
      const downloadSpan = tracer.startSpan('audio.download');
      const audioBuffer = await downloadFromS3(s3Key);
      downloadSpan.end();

      const splitSpan = tracer.startSpan('audio.split');
      const chunks = await splitAudioBySilence(audioBuffer);
      splitSpan.end();

      const transcribeSpan = tracer.startSpan('audio.transcribe');
      const transcription = await transcribeAudio(chunks);
      transcribeSpan.end();

      return transcription;
    });
  }
}
```

---

## 🌐 必須参照リソース

1. [OpenTelemetry Documentation](https://opentelemetry.io/docs/) - OpenTelemetry公式
2. [Jaeger Documentation](https://www.jaegertracing.io/docs/) - Jaeger公式
3. [Distributed Tracing](https://microservices.io/patterns/observability/distributed-tracing.html) - パターン解説

---

**推定実装時間**: 2-3週間（分散トレーシング完全実装）

