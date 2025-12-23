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
        console.log('Adding color columns to user_setting table...');
        
        // primaryColorカラムを追加（存在しない場合のみ）
        try {
            await client.execute(`
                ALTER TABLE user_setting ADD COLUMN primaryColor text DEFAULT '#00D4AA';
            `);
            console.log('✓ Added primaryColor column');
        } catch (error: any) {
            if (error.message?.includes('duplicate column') || error.message?.includes('already exists')) {
                console.log('⚠ primaryColor column already exists');
            } else {
                throw error;
            }
        }
        
        // accentColorカラムを追加（存在しない場合のみ）
        try {
            await client.execute(`
                ALTER TABLE user_setting ADD COLUMN accentColor text DEFAULT '#0D7377';
            `);
            console.log('✓ Added accentColor column');
        } catch (error: any) {
            if (error.message?.includes('duplicate column') || error.message?.includes('already exists')) {
                console.log('⚠ accentColor column already exists');
            } else {
                throw error;
            }
        }
        
        console.log('\n✓ Color columns added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Failed to add color columns:', error);
        process.exit(1);
    }
}

main();
