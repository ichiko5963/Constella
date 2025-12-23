import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import path from 'path';
import { readFileSync } from 'fs';

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

async function runMigration(filePath: string) {
    const sql = readFileSync(filePath, 'utf-8');
    const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const statement of statements) {
        if (statement.trim()) {
            try {
                await client.execute(statement);
                console.log(`✓ Executed statement from ${filePath}`);
            } catch (error: any) {
                // Ignore errors for statements that already exist (like CREATE TABLE IF NOT EXISTS)
                if (error.message?.includes('already exists') || 
                    error.message?.includes('duplicate') ||
                    error.message?.includes('no such index')) {
                    console.log(`⚠ Skipped (already exists): ${error.message}`);
                } else {
                    console.error(`✗ Error executing statement: ${error.message}`);
                    console.error(`Statement: ${statement.substring(0, 100)}...`);
                }
            }
        }
    }
}

async function main() {
    console.log('Running migrations...');
    
    const migrationFiles = [
        path.resolve(process.cwd(), 'drizzle/0000_first_thunderbird.sql'),
        path.resolve(process.cwd(), 'drizzle/0002_loud_warhawk.sql'),
        path.resolve(process.cwd(), 'drizzle/0003_yummy_doctor_octopus.sql'),
        path.resolve(process.cwd(), 'drizzle/0004_absent_thanos.sql'),
    ];
    
    for (const file of migrationFiles) {
        console.log(`\nProcessing ${file}...`);
        await runMigration(file);
    }
    
    console.log('\n✓ Migrations completed!');
    process.exit(0);
}

main().catch(console.error);
