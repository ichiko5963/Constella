import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
    console.log('Creating embedding table...');
    try {
        await client.execute(`
            CREATE TABLE IF NOT EXISTS \`embedding\` (
                \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                \`resourceId\` integer NOT NULL,
                \`resourceType\` text NOT NULL,
                \`content\` text NOT NULL,
                \`embedding\` F32_BLOB(1536),
                \`createdAt\` integer DEFAULT (unixepoch()) NOT NULL
            );
        `);
        console.log('Embedding table created successfully.');
    } catch (e) {
        console.error('Error creating table:', e);
    }
}

main();
