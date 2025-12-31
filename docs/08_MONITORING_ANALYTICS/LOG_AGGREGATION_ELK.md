# ELK Stack ログ集約完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: Elasticsearch + Logstash + Kibana

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [ELK Stack構成](#2-elk-stack構成)
3. [ログ収集設定](#3-ログ収集設定)
4. [Kibanaダッシュボード](#4-kibanaダッシュボード)

---

## 1. エグゼクティブサマリー

### 1.1 ELK Stackとは

Elasticsearch、Logstash、Kibanaの3つのツールを組み合わせたログ管理システムです。

### 1.2 Actoryでの適用

- **アプリケーションログ**: Next.js、Node.jsのログ
- **アクセスログ**: Nginx、API Gatewayのログ
- **エラーログ**: エラー追跡と分析
- **監査ログ**: セキュリティ監査

---

## 2. ELK Stack構成

### 2.1 Logstash設定

```ruby
# logstash/pipeline/actory.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] == "actory-api" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}" }
    }
    
    date {
      match => [ "timestamp", "ISO8601" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "actory-logs-%{+YYYY.MM.dd}"
  }
}
```

### 2.2 アプリケーションログ設定

```typescript
// server/lib/logger.ts
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const esTransport = new ElasticsearchTransport({
  level: 'info',
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  },
  index: 'actory-logs',
});

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    esTransport,
  ],
});
```

---

## 🌐 必須参照リソース

1. [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html) - Elasticsearch公式
2. [Logstash Documentation](https://www.elastic.co/guide/en/logstash/current/index.html) - Logstash公式
3. [Kibana Documentation](https://www.elastic.co/guide/en/kibana/current/index.html) - Kibana公式

---

**推定実装時間**: 2-3週間（ELK Stack完全実装）

