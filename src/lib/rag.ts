import { db } from '@/db';
import { meetingNotes, embeddings } from '@/db/schema';
import { eq, desc, inArray, sql } from 'drizzle-orm';
import { generateEmbedding } from '@/lib/embeddings';

export async function searchContext(query: string, userId?: string) {
    try {
        // 1. Generate Query Embedding (高速化: キャッシュ可能)
        const queryEmbedding = await generateEmbedding(query);
        
        // 2. Vector Search - 最適化されたクエリ
        // Turso/LibSQLのベクトル検索を使用
        const vectorString = JSON.stringify(queryEmbedding);
        
        // 高速化: LIMITを先に適用し、距離でソート
        // ユーザーIDでフィルタリング（セキュリティ）
        let similarChunks;
        if (userId) {
            // ユーザーIDでフィルタリングする場合
            const userNoteIds = await db.query.meetingNotes.findMany({
                where: eq(meetingNotes.userId, userId),
                columns: { id: true }
            });
            const noteIds = userNoteIds.map(n => n.id);
            
            if (noteIds.length === 0) return [];
            
            // 最適化: vector_top_kを使用（近似最近傍探索）
            similarChunks = await db.run(sql`
                SELECT 
                    resourceId, 
                    content, 
                    vector_top_k(embedding, vector(${vectorString}), 5) as distance
                FROM embedding
                WHERE resourceType = 'meeting_note'
                AND resourceId IN (${sql.join(noteIds.map(id => sql`${id}`), sql`, `)})
            `);
        } else {
            // 最適化: vector_top_kを使用（近似最近傍探索）
            similarChunks = await db.run(sql`
                SELECT 
                    resourceId, 
                    content, 
                    vector_top_k(embedding, vector(${vectorString}), 5) as distance
                FROM embedding
                WHERE resourceType = 'meeting_note'
            `);
        }

        // 結果の処理
        const rows = similarChunks.rows || [];
        if (rows.length === 0) return [];

        // 3. ユニークなnoteIdを取得（重複排除）
        const noteIds = [...new Set(rows.map((row: any) => row.resourceId as number))];

        // 4. メタデータを一括取得（N+1問題を回避）
        const notes = await db.query.meetingNotes.findMany({
            where: inArray(meetingNotes.id, noteIds),
            with: {
                project: true
            }
        });

        // 5. 結果を結合（距離でソート済み）
        const results = rows
            .map((chunk: any) => {
                const note = notes.find(n => n.id === chunk.resourceId);
                if (!note) return null;
                return {
                    content: chunk.content,
                    meta: {
                        title: note.title,
                        summary: note.summary,
                        date: note.meetingDate,
                        projectName: note.project?.name,
                        decisions: note.decisions,
                        noteId: note.id
                    },
                    distance: chunk.distance,
                    score: 1 - chunk.distance // 距離をスコアに変換（1に近いほど関連性が高い）
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a, b) => b.score - a.score) // スコアで再ソート
            .slice(0, 3); // 最大3件に制限

        return results;
    } catch (error) {
        console.error('RAG search error:', error);
        return [];
    }
}

export async function getRecentContext(userId: string) {
    try {
        return await db.query.meetingNotes.findMany({
            where: eq(meetingNotes.userId, userId),
            limit: 3,
            orderBy: desc(meetingNotes.createdAt),
            with: {
                project: true
            }
        });
    } catch (error) {
        console.error('Get recent context error:', error);
        return [];
    }
}
