# API Gateway パターン完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: Kong / AWS API Gateway + Rate Limiting + Authentication

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [API Gatewayアーキテクチャ](#2-api-gatewayアーキテクチャ)
3. [実装パターン](#3-実装パターン)
4. [詳細なコード実装例](#4-詳細なコード実装例)

---

## 1. エグゼクティブサマリー

### 1.1 API Gatewayの役割

API Gatewayは、すべてのAPIリクエストのエントリーポイントとして機能し、認証、レート制限、ルーティングなどを一元管理します。

### 1.2 Actoryでの適用

- **認証・認可**: JWTトークンの検証
- **レート制限**: API呼び出し回数の制限
- **ルーティング**: マイクロサービスへのルーティング
- **ログ・モニタリング**: リクエストのログ記録

---

## 2. API Gatewayアーキテクチャ

### 2.1 Kong設定

```yaml
# kong/kong.yml
_format_version: "3.0"

services:
  - name: actory-api
    url: http://localhost:3000
    routes:
      - name: api-route
        paths:
          - /api
        plugins:
          - name: rate-limiting
            config:
              minute: 100
              hour: 1000
          - name: jwt
            config:
              secret_is_base64: false
          - name: cors
            config:
              origins:
                - "*"
              methods:
                - GET
                - POST
                - PUT
                - DELETE
              headers:
                - Authorization
                - Content-Type
```

### 2.2 Next.js Middleware実装

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

export async function middleware(request: NextRequest) {
  // APIルートの認証チェック
  if (request.nextUrl.pathname.startsWith('/api')) {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## 3. 実装パターン

### 3.1 レート制限

```typescript
// server/middleware/rate-limit.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export async function rateLimit(
  identifier: string,
  limit: number,
  window: number
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate_limit:${identifier}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, window);
  }
  
  const remaining = Math.max(0, limit - current);
  
  return {
    allowed: current <= limit,
    remaining,
  };
}
```

---

## 🌐 必須参照リソース

1. [Kong Documentation](https://docs.konghq.com/) - Kong公式
2. [AWS API Gateway](https://docs.aws.amazon.com/apigateway/) - AWS公式
3. [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) - Next.js公式

---

**推定実装時間**: 2-3週間（API Gateway完全実装）

