# Prometheus メトリクス収集完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: Prometheus + Grafana + AlertManager

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [Prometheus設定](#2-prometheus設定)
3. [メトリクス実装](#3-メトリクス実装)
4. [アラート設定](#4-アラート設定)

---

## 1. エグゼクティブサマリー

### 1.1 Prometheusとは

Prometheusは、時系列データベースとメトリクス収集システムです。Actoryでは、システムのパフォーマンスとヘルスを監視します。

### 1.2 監視対象

- **API応答時間**: レイテンシ、エラー率
- **リソース使用率**: CPU、メモリ、ディスク
- **ビジネスメトリクス**: 録音数、議事録生成数

---

## 2. Prometheus設定

### 2.1 prometheus.yml

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'actory-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
    
  - job_name: 'audio-processing'
    static_configs:
      - targets: ['audio-processing:3001']
      
  - job_name: 'ai-processing'
    static_configs:
      - targets: ['ai-processing:3002']
```

### 2.2 メトリクス実装

```typescript
// server/lib/metrics.ts
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

// メトリクスエンドポイント
export async function GET() {
  return Response.json(await register.metrics());
}
```

---

## 🌐 必須参照リソース

1. [Prometheus Documentation](https://prometheus.io/docs/) - Prometheus公式
2. [Grafana Documentation](https://grafana.com/docs/) - Grafana公式
3. [prom-client](https://github.com/siimon/prom-client) - Node.jsクライアント

---

**推定実装時間**: 2-3週間（Prometheus完全実装）

