/**
 * OpenAI Embeddings生成と管理
 * P0-2: Turso Vector Search環境構築
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * テキストからベクトル埋め込みを生成
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * 複数のテキストから一括でベクトル埋め込みを生成
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float',
    });

    return response.data.map(d => d.embedding);
  } catch (error) {
    console.error('Failed to generate embeddings:', error);
    throw new Error('Failed to generate embeddings');
  }
}

/**
 * コサイン類似度を計算
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * テキストをチャンクに分割（オーバーラップあり）
 */
export function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[。\n]/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let currentLength = 0;

  for (const sentence of sentences) {
    const sentenceLength = sentence.length;

    if (currentLength + sentenceLength > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // オーバーラップを作成
      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-Math.floor(overlap / 10));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
      currentLength = currentChunk.length;
    } else {
      currentChunk += sentence + '。';
      currentLength += sentenceLength + 1;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
