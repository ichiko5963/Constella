# ベクトルデータベース完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: Turso DiskANN + OpenAI Embeddings

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [Turso Vector Search実装](#2-turso-vector-search実装)
3. [実装パターン](#3-実装パターン)
4. [詳細なコード実装例](#4-詳細なコード実装例)

---

## 1. エグゼクティブサマリー

### 1.1 ベクトルデータベースとは

ベクトルデータベースは、高次元ベクトルを効率的に検索するためのデータベースです。Actoryでは、TursoのDiskANNを使用します。

### 1.2 Actoryでの適用

- **ナレッジ検索**: 過去の議事録・ナレッジからの類似検索
- **RAG**: 関連情報の検索とコンテキスト構築
- **セマンティック検索**: 意味ベースの検索

---

## 2. Turso Vector Search実装

### 2.1 スキーマ定義

```sql
-- ベクトル埋め込みテーブル
CREATE TABLE knowledge_embeddings (
  id INTEGER PRIMARY KEY,
  embedding VECTOR(1536),  -- text-embedding-3-largeの次元数
  content TEXT NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DiskANNインデックス作成
CREATE INDEX idx_embedding_vector 
ON knowledge_embeddings 
USING DISKANN(embedding);
```

### 2.2 ベクトル検索実装

```typescript
// server/lib/vector-search.ts
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export class VectorSearchService {
  async indexKnowledge(knowledgeId: number, content: string) {
    // 埋め込みベクトルを生成
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: content,
    });

    const vector = embedding.data[0].embedding;

    // Tursoに保存
    await db.execute(sql`
      INSERT INTO knowledge_embeddings (id, embedding, content)
      VALUES (${knowledgeId}, ${JSON.stringify(vector)}, ${content})
      ON CONFLICT(id) DO UPDATE SET
        embedding = ${JSON.stringify(vector)},
        content = ${content}
    `);
  }

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
}
```

---

## 🌐 必須参照リソース

1. [Turso Vector Search](https://docs.turso.tech/vector-search) - Turso公式
2. [DiskANN Algorithm](https://turso.tech/blog/approximate-nearest-neighbor-search-with-diskann-in-libsql) - DiskANN解説
3. [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings) - Embeddings API

---

**推定実装時間**: 2-3週間（ベクトルデータベース完全実装）

