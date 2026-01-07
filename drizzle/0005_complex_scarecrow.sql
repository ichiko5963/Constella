CREATE TABLE `ai_learning_data` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`dataType` text NOT NULL,
	`inputData` text NOT NULL,
	`outputData` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audio_waveform` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recordingId` integer NOT NULL,
	`waveformData` text NOT NULL,
	`peaksData` text,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_generation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`meetingNoteId` integer,
	`contentType` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`status` text DEFAULT 'draft',
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`meetingNoteId`) REFERENCES `meeting_note`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `context_management_session` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`targetFileIds` text,
	`questions` text,
	`responses` text,
	`status` text DEFAULT 'active',
	`createdAt` integer NOT NULL,
	`completedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `external_integration` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`serviceType` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`serviceAccountId` text,
	`isActive` integer DEFAULT true,
	`lastSyncAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `file_link` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sourceFileId` integer NOT NULL,
	`targetFileId` integer NOT NULL,
	`linkType` text DEFAULT 'related',
	`strength` real DEFAULT 0.5,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`sourceFileId`) REFERENCES `file`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`targetFileId`) REFERENCES `file`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `folder_correction` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`projectId` integer NOT NULL,
	`originalPath` text NOT NULL,
	`correctedPath` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `folder_permission` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fileId` integer NOT NULL,
	`userId` text NOT NULL,
	`permission` text NOT NULL,
	`grantedBy` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`fileId`) REFERENCES `file`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`grantedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `imported_content` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`integrationId` integer,
	`contentType` text NOT NULL,
	`originalId` text,
	`title` text,
	`content` text NOT NULL,
	`metadata` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`integrationId`) REFERENCES `external_integration`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `onboarding_response` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`planType` text NOT NULL,
	`businessCount` integer,
	`businessNames` text,
	`departmentCounts` text,
	`departmentNames` text,
	`mainPurpose` text,
	`folderStructure` text,
	`isCompleted` integer DEFAULT false,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `relationship_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`contactName` text,
	`contactEmail` text,
	`contactSlackId` text,
	`relationshipType` text NOT NULL,
	`tone` text,
	`context` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_role` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`projectId` integer NOT NULL,
	`role` text DEFAULT 'participant',
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP INDEX "booking_setting_token_unique";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "subscription_userId_unique";--> statement-breakpoint
DROP INDEX "subscription_stripeCustomerId_unique";--> statement-breakpoint
DROP INDEX "subscription_stripeSubscriptionId_unique";--> statement-breakpoint
DROP INDEX "user_setting_userId_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
ALTER TABLE `audit_log` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.130Z"';--> statement-breakpoint
CREATE UNIQUE INDEX `booking_setting_token_unique` ON `booking_setting` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_userId_unique` ON `subscription` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_stripeCustomerId_unique` ON `subscription` (`stripeCustomerId`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_stripeSubscriptionId_unique` ON `subscription` (`stripeSubscriptionId`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_setting_userId_unique` ON `user_setting` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
ALTER TABLE `booking_setting` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.130Z"';--> statement-breakpoint
ALTER TABLE `booking` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.130Z"';--> statement-breakpoint
ALTER TABLE `bookmark` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `calendar_event` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `calendar_integration` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `chat_conversation` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `chat_message` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `comment` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.130Z"';--> statement-breakpoint
ALTER TABLE `custom_prompt` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `embedding` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `file` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `file` ADD `isArchived` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `file` ADD `sharedToTeam` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `highlight` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `integration` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.130Z"';--> statement-breakpoint
ALTER TABLE `meeting_note` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `project` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `recording_segment` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.130Z"';--> statement-breakpoint
ALTER TABLE `recording` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `reminder` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `snippet` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `subscription` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `summary_template` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.130Z"';--> statement-breakpoint
ALTER TABLE `task_candidate` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `task` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `transcript_segment` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `user_setting` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.129Z"';--> statement-breakpoint
ALTER TABLE `weekly_report` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2026-01-07T19:46:24.130Z"';