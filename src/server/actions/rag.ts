'use server';

import { db } from '@/db';
import { embeddings } from '@/db/schema';
import { generateEmbedding } from '@/lib/embeddings';
import { eq, and } from 'drizzle-orm';

/**
 * Indexes a meeting note by chunking its content and generating embeddings.
 * This should be called after a meeting note is created or updated.
 */
export async function indexMeetingNote(noteId: number, content: string) {
    if (!content) return;

    // 1. Delete existing embeddings for this note (re-indexing)
    await db.delete(embeddings).where(
        and(
            eq(embeddings.resourceId, noteId),
            eq(embeddings.resourceType, 'meeting_note')
        )
    );
    // Oops, filtering by multiple conditions requires 'and'.
    // Let's refine the delete query below.

    // 2. Chunk existing content (Simple paragraph/sentence splitting for now)
    // Ideally use a text splitter library like LangChain's RecursiveCharacterTextSplitter
    // For MVP: Split by paragraphs
    const chunks = content.split('\n\n').filter(c => c.trim().length > 20);

    if (chunks.length === 0) return;

    // 3. Generate Embeddings for chunks
    const embeddingsData = [];
    for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk);
        embeddingsData.push({
            resourceId: noteId,
            resourceType: 'meeting_note',
            content: chunk,
            embedding: embedding
        });
    }

    // 4. Batch Insert
    if (embeddingsData.length > 0) {
        await db.insert(embeddings).values(embeddingsData);
    }

    console.log(`Indexed note ${noteId} with ${embeddingsData.length} chunks.`);
}
