# RAG (Retrieval-Augmented Generation) 完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [RAGアーキテクチャ詳解](#2-ragアーキテクチャ詳解)
3. [実装パターンとベストプラクティス](#3-実装パターンとベストプラクティス)
4. [詳細なコード実装例](#4-詳細なコード実装例)
5. [パフォーマンスチューニング](#5-パフォーマンスチューニング)
6. [トラブルシューティングガイド](#6-トラブルシューティングガイド)

---

## 1. エグゼクティブサマリー

### 1.1 RAGの概要

RAG (Retrieval-Augmented Generation) は、外部の知識ベースから関連情報を検索し、その情報をコンテキストとしてLLMに提供することで、より正確で最新の回答を生成する技術です。

### 1.2 ActoryでのRAG活用

- **議事録検索**: 過去の会議内容から関連情報を検索
- **ナレッジベース**: 蓄積されたナレッジから回答を生成
- **コンテキスト管理**: ユーザーの質問に対して最適なコンテキストを提供
- **タスク抽出**: 会議内容からタスクを自動抽出

---

## 2. RAGアーキテクチャ詳解

### 2.1 RAGパイプライン

```
1. クエリ受信
   ↓
2. クエリをベクトル化（Embedding）
   ↓
3. ベクトル検索（Turso DiskANN）
   ↓
4. 全文検索（Turso FTS5）
   ↓
5. ハイブリッド検索（結果マージ）
   ↓
6. 関連ドキュメント取得
   ↓
7. コンテキスト構築
   ↓
8. LLMに送信（GPT-4）
   ↓
9. 回答生成
```

### 2.2 Turso Vector Search統合

```typescript
// server/lib/rag/vector-search.ts
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export class VectorSearchService {
  // ナレッジをインデックス化
  async indexKnowledge(knowledgeId: number, content: string) {
    // 埋め込みベクトルを生成
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: content,
    });

    const vector = embedding.data[0].embedding;

    // Tursoに保存（DiskANNインデックス）
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
}
```

---

## 3. 実装パターンとベストプラクティス

### 3.1 ハイブリッド検索実装

```typescript
// server/lib/rag/hybrid-search.ts
export class HybridSearchService {
  async search(
    query: string,
    limit: number = 5
  ): Promise<Array<{ id: number; content: string; score: number }>> {
    // ベクトル検索
    const vectorResults = await this.vectorSearch.searchSimilar(query, limit * 2);
    
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
    
    // ベクトル検索のスコア
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

### 3.2 コンテキスト構築

```typescript
// server/lib/rag/context-builder.ts
export class ContextBuilder {
  buildContext(
    relevantDocs: Array<{ content: string; score: number }>,
    maxTokens: number = 4000
  ): string {
    let context = '';
    let tokenCount = 0;

    // スコア順にソート
    const sortedDocs = relevantDocs.sort((a, b) => b.score - a.score);

    for (const doc of sortedDocs) {
      const docTokens = this.estimateTokens(doc.content);
      
      if (tokenCount + docTokens > maxTokens) {
        break;
      }

      context += `\n\n---\n\n${doc.content}`;
      tokenCount += docTokens;
    }

    return context;
  }

  private estimateTokens(text: string): number {
    // 簡易的なトークン数推定（実際はtiktokenを使用）
    return Math.ceil(text.length / 4);
  }
}
```

---

## 4. 詳細なコード実装例

### 4.1 RAGチャット実装

```typescript
// app/api/chat/route.ts
import { OpenAI } from 'openai';
import { HybridSearchService } from '@/server/lib/rag/hybrid-search';
import { ContextBuilder } from '@/server/lib/rag/context-builder';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const hybridSearch = new HybridSearchService();
const contextBuilder = new ContextBuilder();

export async function POST(request: Request) {
  const { message, userId } = await request.json();

  // 1. 関連ナレッジを検索
  const relevantDocs = await hybridSearch.search(message, 5);

  // 2. コンテキストを構築
  const context = contextBuilder.buildContext(relevantDocs);

  // 3. LLMに送信
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `あなたはActoryのAIアシスタントです。
以下のコンテキストを参考にして、ユーザーの質問に答えてください。

コンテキスト:
${context}`,
      },
      {
        role: 'user',
        content: message,
      },
    ],
    temperature: 0.7,
  });

  const response = completion.choices[0].message.content;

  // 4. 回答を保存（学習用）
  await saveConversation({
    userId,
    query: message,
    response,
    relevantDocs: relevantDocs.map(d => d.id),
  });

  return Response.json({ response });
}
```

---

## 5. パフォーマンスチューニング

### 5.1 キャッシング戦略

```typescript
// server/lib/rag/cached-search.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export class CachedSearchService {
  async search(query: string, limit: number = 5) {
    const cacheKey = `search:${query}:${limit}`;
    
    // キャッシュから取得を試みる
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 検索実行
    const results = await hybridSearch.search(query, limit);

    // キャッシュに保存（5分）
    await redis.setex(cacheKey, 300, JSON.stringify(results));

    return results;
  }
}
```

---

## 🌐 必須参照リソース

1. [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
2. [Turso Vector Search](https://docs.turso.tech/vector-search)
3. [LangChain RAG](https://js.langchain.com/docs/use_cases/question_answering/)
4. [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)
5. [Vector Database Comparison](https://www.pinecone.io/learn/vector-database/)

---

**推定実装時間**: 2-3週間（完全なRAG実装）

