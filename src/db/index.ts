import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// 環境変数の取得（Next.jsではサーバーサイドで自動的に読み込まれる）
const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl) {
    console.error('Environment variables:', {
        TURSO_DATABASE_URL: databaseUrl ? 'defined' : 'undefined',
        TURSO_AUTH_TOKEN: authToken ? 'defined' : 'undefined',
        NODE_ENV: process.env.NODE_ENV,
    });
    throw new Error(
        'TURSO_DATABASE_URL is not defined. Please check your .env.local file and restart the development server.'
    );
}

const client = createClient({
    url: databaseUrl,
    authToken: authToken,
});

export const db = drizzle(client, { schema });
