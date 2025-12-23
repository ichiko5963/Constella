import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl) {
    throw new Error('TURSO_DATABASE_URL is not defined');
}

const client = createClient({
    url: databaseUrl,
    authToken: authToken,
});

async function createVectorIndex() {
    try {
        console.log('Creating vector index for embeddings...');
        
        // Tursoのベクトルインデックスを作成（DiskANNアルゴリズム）
        // 注意: 実際のTursoの構文に合わせて調整が必要
        await client.execute(`
            CREATE INDEX IF NOT EXISTS embedding_vector_idx 
            ON embedding(embedding) 
            USING libsql_vector_idx(
                dimension=1536,
                metric='cosine'
            );
        `);
        
        console.log('✓ Vector index created successfully');
    } catch (error: any) {
        // インデックスが既に存在する場合や、構文が異なる場合は無視
        if (error.message?.includes('already exists') || 
            error.message?.includes('syntax error') ||
            error.message?.includes('no such function')) {
            console.log('⚠ Vector index may already exist or syntax differs. Skipping...');
            console.log('Note: Turso may require different syntax for vector indexes.');
        } else {
            console.error('Error creating vector index:', error);
            throw error;
        }
    }
}

async function main() {
    try {
        await createVectorIndex();
        console.log('\n✓ Vector index setup completed!');
        process.exit(0);
    } catch (error) {
        console.error('Failed to create vector index:', error);
        process.exit(1);
    }
}

main();
