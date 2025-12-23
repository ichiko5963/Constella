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
    // 本番環境ではエラーをスロー、開発環境では警告のみ
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
let db: ReturnType<typeof drizzle>;

if (databaseUrl) {
    const client = createClient({
        url: databaseUrl,
        authToken: authToken,
    });
    db = drizzle(client, { schema });
} else {
    // 開発環境でデータベースURLが設定されていない場合、ダミーのクライアントを作成
    // 実際の使用時にエラーが発生するが、モジュール読み込み時にはエラーをスローしない
    const dummyClient = createClient({
        url: 'file:./dummy.db',
        authToken: '',
    });
    db = drizzle(dummyClient, { schema });
}

export { db };
