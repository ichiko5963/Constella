# k6 パフォーマンステスト完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: k6 + Grafana Cloud

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [k6テストスクリプト](#2-k6テストスクリプト)
3. [負荷テストシナリオ](#3-負荷テストシナリオ)
4. [CI/CD統合](#4-cicd統合)

---

## 1. エグゼクティブサマリー

### 1.1 k6とは

k6は、Goで書かれたモダンな負荷テストツールです。Actoryでは、APIのパフォーマンステストに使用します。

### 1.2 テスト対象

- **API応答時間**: P95、P99レイテンシ
- **スループット**: 1秒あたりのリクエスト数
- **エラー率**: 5xxエラーの発生率
- **同時接続数**: 最大同時ユーザー数

---

## 2. k6テストスクリプト

### 2.1 基本テスト

```javascript
// tests/performance/api-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // 2分で100ユーザーまで
    { duration: '5m', target: 100 },  // 5分間100ユーザー維持
    { duration: '2m', target: 200 },  // 2分で200ユーザーまで
    { duration: '5m', target: 200 },  // 5分間200ユーザー維持
    { duration: '2m', target: 0 },    // 2分で0ユーザーまで
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.1'],
  },
};

export default function () {
  const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

  // 認証
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'password',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const success = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
  });

  errorRate.add(!success);

  if (!success) {
    return;
  }

  const token = JSON.parse(loginRes.body).token;

  // API呼び出し
  const projectsRes = http.get(`${BASE_URL}/api/projects`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  check(projectsRes, {
    'projects status is 200': (r) => r.status === 200,
    'projects response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

---

## 🌐 必須参照リソース

1. [k6 Documentation](https://k6.io/docs/) - k6公式
2. [k6 Cloud](https://k6.io/docs/cloud/) - k6 Cloud
3. [Load Testing Best Practices](https://k6.io/docs/test-types/load-testing/) - ベストプラクティス

---

**推定実装時間**: 1-2週間（k6パフォーマンステスト完全実装）

