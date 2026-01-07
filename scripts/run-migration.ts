import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function runMigrations() {
  const statements = [
    // Create new tables if they don't exist
    `CREATE TABLE IF NOT EXISTS \`ai_learning_data\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`userId\` text NOT NULL,
      \`dataType\` text NOT NULL,
      \`inputData\` text NOT NULL,
      \`outputData\` text NOT NULL,
      \`createdAt\` integer NOT NULL,
      FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON UPDATE no action ON DELETE no action
    )`,
    `CREATE TABLE IF NOT EXISTS \`audio_waveform\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`recordingId\` integer NOT NULL,
      \`waveformData\` text NOT NULL,
      \`peaksData\` text,
      \`createdAt\` integer NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS \`content_generation\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`userId\` text NOT NULL,
      \`meetingNoteId\` integer,
      \`contentType\` text NOT NULL,
      \`title\` text NOT NULL,
      \`content\` text NOT NULL,
      \`metadata\` text,
      \`status\` text DEFAULT 'draft',
      \`createdAt\` integer NOT NULL,
      \`updatedAt\` integer NOT NULL,
      FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON UPDATE no action ON DELETE no action,
      FOREIGN KEY (\`meetingNoteId\`) REFERENCES \`meeting_note\`(\`id\`) ON UPDATE no action ON DELETE no action
    )`,
    `CREATE TABLE IF NOT EXISTS \`context_management_session\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`userId\` text NOT NULL,
      \`targetFileIds\` text,
      \`questions\` text,
      \`responses\` text,
      \`status\` text DEFAULT 'active',
      \`createdAt\` integer NOT NULL,
      \`completedAt\` integer,
      FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON UPDATE no action ON DELETE no action
    )`,
    `CREATE TABLE IF NOT EXISTS \`external_integration\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`userId\` text NOT NULL,
      \`serviceType\` text NOT NULL,
      \`accessToken\` text,
      \`refreshToken\` text,
      \`serviceAccountId\` text,
      \`isActive\` integer DEFAULT true,
      \`lastSyncAt\` integer,
      \`createdAt\` integer NOT NULL,
      \`updatedAt\` integer NOT NULL,
      FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON UPDATE no action ON DELETE no action
    )`,
    `CREATE TABLE IF NOT EXISTS \`file_link\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`sourceFileId\` integer NOT NULL,
      \`targetFileId\` integer NOT NULL,
      \`linkType\` text DEFAULT 'related',
      \`strength\` real DEFAULT 0.5,
      \`createdAt\` integer NOT NULL,
      FOREIGN KEY (\`sourceFileId\`) REFERENCES \`file\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`targetFileId\`) REFERENCES \`file\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
    `CREATE TABLE IF NOT EXISTS \`folder_correction\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`userId\` text NOT NULL,
      \`projectId\` integer NOT NULL,
      \`originalPath\` text NOT NULL,
      \`correctedPath\` text NOT NULL,
      \`content\` text NOT NULL,
      \`createdAt\` integer NOT NULL,
      FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON UPDATE no action ON DELETE no action,
      FOREIGN KEY (\`projectId\`) REFERENCES \`project\`(\`id\`) ON UPDATE no action ON DELETE no action
    )`,
    `CREATE TABLE IF NOT EXISTS \`folder_permission\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`fileId\` integer NOT NULL,
      \`userId\` text NOT NULL,
      \`permission\` text NOT NULL,
      \`grantedBy\` text NOT NULL,
      \`createdAt\` integer NOT NULL,
      FOREIGN KEY (\`fileId\`) REFERENCES \`file\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON UPDATE no action ON DELETE no action,
      FOREIGN KEY (\`grantedBy\`) REFERENCES \`user\`(\`id\`) ON UPDATE no action ON DELETE no action
    )`,
    `CREATE TABLE IF NOT EXISTS \`imported_content\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`userId\` text NOT NULL,
      \`integrationId\` integer,
      \`contentType\` text NOT NULL,
      \`originalId\` text,
      \`title\` text,
      \`content\` text NOT NULL,
      \`metadata\` text,
      \`createdAt\` integer NOT NULL,
      FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON UPDATE no action ON DELETE no action,
      FOREIGN KEY (\`integrationId\`) REFERENCES \`external_integration\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
    `CREATE TABLE IF NOT EXISTS \`onboarding_response\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`userId\` text NOT NULL,
      \`planType\` text NOT NULL,
      \`businessCount\` integer,
      \`businessNames\` text,
      \`departmentCounts\` text,
      \`departmentNames\` text,
      \`mainPurpose\` text,
      \`folderStructure\` text,
      \`isCompleted\` integer DEFAULT false,
      \`createdAt\` integer NOT NULL,
      \`updatedAt\` integer NOT NULL,
      FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON UPDATE no action ON DELETE no action
    )`,
    `CREATE TABLE IF NOT EXISTS \`relationship_profile\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`userId\` text NOT NULL,
      \`contactName\` text,
      \`contactEmail\` text,
      \`contactSlackId\` text,
      \`relationshipType\` text NOT NULL,
      \`tone\` text,
      \`context\` text,
      \`createdAt\` integer NOT NULL,
      \`updatedAt\` integer NOT NULL,
      FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON UPDATE no action ON DELETE no action
    )`,
    `CREATE TABLE IF NOT EXISTS \`user_role\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`userId\` text NOT NULL,
      \`projectId\` integer NOT NULL,
      \`role\` text DEFAULT 'participant',
      \`createdAt\` integer NOT NULL,
      FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON UPDATE no action ON DELETE no action,
      FOREIGN KEY (\`projectId\`) REFERENCES \`project\`(\`id\`) ON UPDATE no action ON DELETE no action
    )`,
  ];

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      console.log('✓ Executed:', stmt.substring(0, 50) + '...');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('⏭ Table already exists, skipping...');
      } else {
        console.error('✗ Error:', error.message);
      }
    }
  }

  // Add columns if they don't exist (SQLite doesn't support IF NOT EXISTS for columns)
  const alterStatements = [
    `ALTER TABLE \`file\` ADD COLUMN \`isArchived\` integer DEFAULT false`,
    `ALTER TABLE \`file\` ADD COLUMN \`sharedToTeam\` integer DEFAULT false`,
  ];

  for (const stmt of alterStatements) {
    try {
      await client.execute(stmt);
      console.log('✓ Column added');
    } catch (error: any) {
      if (error.message?.includes('duplicate column') || error.message?.includes('already exists')) {
        console.log('⏭ Column already exists, skipping...');
      } else {
        console.error('✗ Error:', error.message);
      }
    }
  }

  console.log('\n✅ Migration completed!');
}

runMigrations().catch(console.error);
