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

async function main() {
    try {
        console.log('Creating user_setting table...');
        
        // user_settingテーブルを作成（存在しない場合のみ）
        await client.execute(`
            CREATE TABLE IF NOT EXISTS user_setting (
                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                userId text NOT NULL UNIQUE,
                backgroundTheme text DEFAULT 'default',
                primaryColor text DEFAULT '#00D4AA',
                accentColor text DEFAULT '#0D7377',
                createdAt integer NOT NULL DEFAULT (strftime('%s', 'now')),
                updatedAt integer NOT NULL DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (userId) REFERENCES user(id) ON UPDATE no action ON DELETE no action
            );
        `);
        console.log('✓ Created user_setting table');
        
        // インデックスを作成
        try {
            await client.execute(`
                CREATE UNIQUE INDEX IF NOT EXISTS user_setting_userId_unique ON user_setting (userId);
            `);
            console.log('✓ Created user_setting_userId_unique index');
        } catch (error: any) {
            if (error.message?.includes('already exists')) {
                console.log('⚠ Index already exists');
            } else {
                throw error;
            }
        }
        
        console.log('\n✓ user_setting table created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Failed to create user_setting table:', error);
        process.exit(1);
    }
}

main();
