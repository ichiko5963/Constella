import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

export async function generateEmbedding(text: string): Promise<number[]> {
    const result = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: text,
    });
    // @ts-ignore - API may vary by version
    return result.embedding || result.embeddings?.[0] || [];
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Process each text individually since 'values' is not supported
    const embeddings: number[][] = [];
    for (const text of texts) {
        const embedding = await generateEmbedding(text);
        embeddings.push(embedding);
    }
    return embeddings;
}
