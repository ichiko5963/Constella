/**
 * ベクトル検索とハイブリッド検索
 * P0-2: Turso Vector Search環境構築
 */

'use server';

import { db } from '@/db';
import { embeddings, meetingNotes } from '@/db/schema';
import { sql, eq, and, desc } from 'drizzle-orm';
import { generateEmbedding, cosineSimilarity, chunkText } from '@/lib/embeddings';
import { auth } from '@/auth';

/**
 * 議事録のベクトル埋め込みを生成して保存
 */
export async function createEmbeddingsForNote(noteId: number, content: string) {
  try {
    // コンテンツをチャンクに分割
    const chunks = chunkText(content, 500, 50);

    // 各チャンクの埋め込みを生成
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk);

      // データベースに保存
      await db.insert(embeddings).values({
        resourceId: noteId,
        resourceType: 'meeting_note',
        content: chunk,
        embedding: embedding,
        createdAt: new Date(),
      });
    }

    return { success: true, chunksCreated: chunks.length };
  } catch (error) {
    console.error('Failed to create embeddings:', error);
    throw new Error('Failed to create embeddings');
  }
}

/**
 * ベクトル検索：クエリテキストに類似したコンテンツを検索
 */
export async function vectorSearch(query: string, limit: number = 5) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // クエリのベクトル埋め込みを生成
    const queryEmbedding = await generateEmbedding(query);

    // 全ての埋め込みを取得（Tursoの制約により、クライアント側で類似度計算）
    const allEmbeddings = await db
      .select()
      .from(embeddings)
      .limit(1000); // 最大1000件

    // 類似度を計算してソート
    const results = allEmbeddings
      .map(emb => ({
        ...emb,
        similarity: emb.embedding ? cosineSimilarity(queryEmbedding, emb.embedding as unknown as number[]) : 0,
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    // 議事録の詳細情報を取得
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        if (result.resourceType === 'meeting_note') {
          const note = await db.query.meetingNotes.findFirst({
            where: eq(meetingNotes.id, result.resourceId),
          });

          return {
            ...result,
            note,
          };
        }
        return result;
      })
    );

    return enrichedResults;
  } catch (error) {
    console.error('Vector search failed:', error);
    throw new Error('Vector search failed');
  }
}

/**
 * 全文検索（FTS5）: SQLiteの全文検索機能を使用
 */
export async function fullTextSearch(query: string, limit: number = 5) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // SQLiteのFTS5を使った全文検索
    // 注意: FTS5仮想テーブルが必要（マイグレーションで作成）
    const results = await db
      .select()
      .from(meetingNotes)
      .where(
        sql`${meetingNotes.formattedMinutes} LIKE ${'%' + query + '%'} OR ${meetingNotes.title} LIKE ${'%' + query + '%'}`
      )
      .limit(limit);

    return results;
  } catch (error) {
    console.error('Full text search failed:', error);
    throw new Error('Full text search failed');
  }
}

/**
 * ハイブリッド検索: ベクトル検索と全文検索の結果を統合
 */
export async function hybridSearch(query: string, limit: number = 10) {
  try {
    // ベクトル検索と全文検索を並行実行
    const [vectorResults, ftsResults] = await Promise.all([
      vectorSearch(query, limit * 2),
      fullTextSearch(query, limit * 2),
    ]);

    // スコアマップを作成
    const scoreMap = new Map<number, { score: number; data: any }>();

    // ベクトル検索結果をスコアリング（類似度をそのまま使用）
    vectorResults.forEach((result, index) => {
      if (result.note) {
        const noteId = result.note.id;
        const score = result.similarity * (vectorResults.length - index);
        scoreMap.set(noteId, {
          score: (scoreMap.get(noteId)?.score || 0) + score,
          data: result.note,
        });
      }
    });

    // 全文検索結果をスコアリング（順位ベース）
    ftsResults.forEach((result, index) => {
      const noteId = result.id;
      const score = (ftsResults.length - index) * 0.5; // ベクトル検索より低い重み
      const existing = scoreMap.get(noteId);
      if (existing) {
        scoreMap.set(noteId, {
          score: existing.score + score,
          data: result,
        });
      } else {
        scoreMap.set(noteId, {
          score,
          data: result,
        });
      }
    });

    // スコアでソートして上位N件を返す
    const sortedResults = Array.from(scoreMap.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit)
      .map(([id, { score, data }]) => ({
        id,
        score,
        ...data,
      }));

    return sortedResults;
  } catch (error) {
    console.error('Hybrid search failed:', error);
    throw new Error('Hybrid search failed');
  }
}

/**
 * 関連ナレッジを検索（特定の議事録に関連するものを探す）
 */
export async function findRelatedNotes(noteId: number, limit: number = 5) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // 対象の議事録を取得
    const note = await db.query.meetingNotes.findFirst({
      where: eq(meetingNotes.id, noteId),
    });

    if (!note) {
      throw new Error('Note not found');
    }

    // 議事録の内容でベクトル検索
    const relatedResults = await vectorSearch(
      note.formattedMinutes || note.summary || note.title,
      limit + 1
    );

    // 自分自身を除外
    const filtered = relatedResults.filter(r => r.note?.id !== noteId).slice(0, limit);

    return filtered;
  } catch (error) {
    console.error('Failed to find related notes:', error);
    throw new Error('Failed to find related notes');
  }
}

