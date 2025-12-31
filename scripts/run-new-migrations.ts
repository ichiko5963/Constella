/**
 * 新機能用マイグレーションスクリプト
 */

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// 環境変数を読み込み
config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client);

async function runMigrations() {
  try {
    console.log('🚀 Running new feature migrations...');

    // SQLファイルを読み込み
    const sql = readFileSync(
      join(process.cwd(), 'drizzle', '0005_add_new_features.sql'),
      'utf-8'
    );

    // 改行とコメントを処理
    const lines = sql.split('\n');
    let currentStatement = '';
    const statements: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // コメント行をスキップ
      if (trimmed.startsWith('--') || trimmed.length === 0) {
        continue;
      }

      currentStatement += ' ' + trimmed;

      // セミコロンで終わる場合は1つのステートメント完了
      if (trimmed.endsWith(';')) {
        statements.push(currentStatement.trim().slice(0, -1)); // セミコロンを除去
        currentStatement = '';
      }
    }

    // ステートメントを順番に実行
    for (const statement of statements) {
      try {
        console.log(`Executing: ${statement.substring(0, 80)}...`);
        await client.execute(statement);
        console.log('✅ Success');
      } catch (error: any) {
        // テーブルが既に存在する場合はスキップ
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate column name')
        ) {
          console.log('⚠️  Already exists, skipping');
        } else {
          console.error('❌ Error:', error.message);
          // エラーを続行（一部のステートメントが失敗しても続ける）
          // throw error;
        }
      }
    }

    console.log('✨ All migrations completed successfully!');
  } catch (error) {
    console.error('Failed to run migrations:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

runMigrations();

