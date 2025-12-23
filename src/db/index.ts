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
    // 開発環境では警告のみ、本番環境ではエラー
    if (process.env.NODE_ENV === 'production') {
        throw new Error(
            'TURSO_DATABASE_URL is not defined. Please check your environment variables.'
        );
    } else {
        console.warn(
            '⚠️ TURSO_DATABASE_URL is not defined. Database operations will fail. Please check your .env.local file.'
        );
    }
}

// データベースURLが設定されている場合のみクライアントを作成
let client: ReturnType<typeof createClient> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

if (databaseUrl) {
    client = createClient({
        url: databaseUrl,
        authToken: authToken,
    });
    dbInstance = drizzle(client, { schema });
}

// データベースが利用可能でない場合でもエラーをスローしないようにする
export const db = dbInstance || (() => {
    throw new Error('Database is not configured. Please set TURSO_DATABASE_URL in your environment variables.');
})();
