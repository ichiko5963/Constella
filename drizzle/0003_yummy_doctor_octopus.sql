CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text,
	`action` text NOT NULL,
	`resourceType` text NOT NULL,
	`resourceId` integer,
	`ipAddress` text,
	`userAgent` text,
	`metadata` text,
	`createdAt` integer DEFAULT '"2025-12-23T00:25:41.364Z"' NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `booking_setting` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`title` text DEFAULT '予約可能な時間' NOT NULL,
	`description` text,
	`duration` integer DEFAULT 30 NOT NULL,
	`bufferTime` integer DEFAULT 0,
	`businessHoursStart` integer DEFAULT 9,
	`businessHoursEnd` integer DEFAULT 18,
	`availableDays` text,
	`timezone` text DEFAULT 'Asia/Tokyo',
	`autoGenerateMeetLink` integer DEFAULT true,
	`autoJoinActory` integer DEFAULT true,
	`autoRecord` integer DEFAULT false,
	`enabled` integer DEFAULT true,
	`createdAt` integer DEFAULT '"2025-12-23T00:25:41.364Z"' NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `booking_setting_token_unique` ON `booking_setting` (`token`);--> statement-breakpoint
CREATE TABLE `booking` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bookingSettingId` integer NOT NULL,
	`userId` text NOT NULL,
	`attendeeName` text NOT NULL,
	`attendeeEmail` text NOT NULL,
	`message` text,
	`startTime` integer NOT NULL,
	`endTime` integer NOT NULL,
	`meetingLink` text,
	`googleCalendarEventId` text,
	`calendarEventId` integer,
	`status` text DEFAULT 'confirmed',
	`createdAt` integer DEFAULT '"2025-12-23T00:25:41.364Z"' NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`bookingSettingId`) REFERENCES `booking_setting`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`calendarEventId`) REFERENCES `calendar_event`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `comment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`noteId` integer NOT NULL,
	`userId` text NOT NULL,
	`content` text NOT NULL,
	`mentions` text,
	`highlightStart` integer,
	`highlightEnd` integer,
	`createdAt` integer DEFAULT '"2025-12-23T00:25:41.363Z"' NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`noteId`) REFERENCES `meeting_note`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `custom_prompt` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`prompt` text NOT NULL,
	`variables` text,
	`isDefault` integer DEFAULT false,
	`createdAt` integer DEFAULT '"2025-12-23T00:25:41.363Z"' NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `integration` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`provider` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`expiresAt` integer,
	`webhookUrl` text,
	`enabled` integer DEFAULT true,
	`settings` text,
	`lastSyncAt` integer,
	`createdAt` integer DEFAULT '"2025-12-23T00:25:41.363Z"' NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `recording_segment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recordingId` integer NOT NULL,
	`speakerId` integer NOT NULL,
	`speakerLabel` text,
	`startTime` integer NOT NULL,
	`endTime` integer NOT NULL,
	`confidence` real,
	`embedding` text,
	`createdAt` integer DEFAULT '"2025-12-23T00:25:41.364Z"' NOT NULL,
	FOREIGN KEY (`recordingId`) REFERENCES `recording`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `snippet` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`noteId` integer,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`tags` text,
	`startTime` integer,
	`endTime` integer,
	`createdAt` integer DEFAULT '"2025-12-23T00:25:41.363Z"' NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`noteId`) REFERENCES `meeting_note`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `summary_template` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text,
	`name` text NOT NULL,
	`description` text,
	`prompt` text NOT NULL,
	`outputFormat` text DEFAULT 'markdown',
	`variables` text,
	`isDefault` integer DEFAULT false,
	`createdAt` integer DEFAULT '"2025-12-23T00:25:41.363Z"' NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transcript_segment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recordingId` integer NOT NULL,
	`noteId` integer,
	`word` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`speaker` text,
	`speakerId` integer,
	`speakerName` text,
	`wordIndex` integer NOT NULL,
	`createdAt` integer DEFAULT '"2025-12-23T00:25:41.360Z"' NOT NULL,
	FOREIGN KEY (`recordingId`) REFERENCES `recording`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`noteId`) REFERENCES `meeting_note`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `weekly_report` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`weekStartDate` integer NOT NULL,
	`weekEndDate` integer NOT NULL,
	`totalMeetings` integer DEFAULT 0,
	`totalDuration` integer DEFAULT 0,
	`totalTasks` integer DEFAULT 0,
	`completedTasks` integer DEFAULT 0,
	`summary` text,
	`keyMetrics` text,
	`topProjects` text,
	`createdAt` integer DEFAULT '"2025-12-23T00:25:41.363Z"' NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP INDEX "booking_setting_token_unique";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "subscription_userId_unique";--> statement-breakpoint
DROP INDEX "subscription_stripeCustomerId_unique";--> statement-breakpoint
DROP INDEX "subscription_stripeSubscriptionId_unique";--> statement-breakpoint
DROP INDEX "user_setting_userId_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
ALTER TABLE `bookmark` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:25:41.361Z"';--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_userId_unique` ON `subscription` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_stripeCustomerId_unique` ON `subscription` (`stripeCustomerId`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_stripeSubscriptionId_unique` ON `subscription` (`stripeSubscriptionId`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_setting_userId_unique` ON `user_setting` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_calendar_event` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`integrationId` integer,
	`externalId` text,
	`title` text NOT NULL,
	`description` text,
	`startTime` integer NOT NULL,
	`endTime` integer NOT NULL,
	`meetingLink` text,
	`location` text,
	`attendees` text,
	`projectId` integer,
	`autoJoinEnabled` integer DEFAULT false,
	`autoRecordEnabled` integer DEFAULT false,
	`recordingId` integer,
	`joinStatus` text DEFAULT 'pending',
	`joinedAt` integer,
	`createdAt` integer DEFAULT '"2025-12-23T00:25:41.363Z"' NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`integrationId`) REFERENCES `calendar_integration`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recordingId`) REFERENCES `recording`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_calendar_event`("id", "userId", "integrationId", "externalId", "title", "description", "startTime", "endTime", "meetingLink", "location", "attendees", "projectId", "autoJoinEnabled", "autoRecordEnabled", "recordingId", "joinStatus", "joinedAt", "createdAt", "updatedAt") SELECT "id", "userId", "integrationId", "externalId", "title", "description", "startTime", "endTime", "meetingLink", "location", "attendees", "projectId", "autoJoinEnabled", "autoRecordEnabled", "recordingId", "joinStatus", "joinedAt", "createdAt", "updatedAt" FROM `calendar_event`;--> statement-breakpoint
DROP TABLE `calendar_event`;--> statement-breakpoint
ALTER TABLE `__new_calendar_event` RENAME TO `calendar_event`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `calendar_integration` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:25:41.363Z"';--> statement-breakpoint
ALTER TABLE `chat_conversation` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:25:41.362Z"';--> statement-breakpoint
ALTER TABLE `chat_message` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:25:41.362Z"';--> statement-breakpoint
ALTER TABLE `embedding` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:25:41.362Z"';--> statement-breakpoint
ALTER TABLE `file` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:25:41.360Z"';--> statement-breakpoint
ALTER TABLE `highlight` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:25:41.361Z"';--> statement-breakpoint
ALTER TABLE `meeting_note` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:25:41.361Z"';--> statement-breakpoint
ALTER TABLE `project` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:25:41.360Z"';--> statement-breakpoint
ALTER TABLE `recording` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:25:41.360Z"';--> statement-breakpoint
ALTER TABLE `reminder` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:25:41.362Z"';--> statement-breakpoint
ALTER TABLE `subscription` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:25:41.362Z"';--> statement-breakpoint
ALTER TABLE `task_candidate` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:25:41.362Z"';--> statement-breakpoint
ALTER TABLE `task` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:25:41.362Z"';--> statement-breakpoint
ALTER TABLE `user_setting` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:25:41.363Z"';