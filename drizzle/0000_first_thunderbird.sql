CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_conversation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`title` text,
	`lastMessageAt` integer NOT NULL,
	`messageCount` integer DEFAULT 0,
	`createdAt` integer DEFAULT '"2025-12-22T01:07:40.571Z"' NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_message` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversationId` integer NOT NULL,
	`userId` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`sources` text,
	`createdAt` integer DEFAULT '"2025-12-22T01:07:40.572Z"' NOT NULL,
	FOREIGN KEY (`conversationId`) REFERENCES `chat_conversation`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `embedding` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resourceId` integer NOT NULL,
	`resourceType` text NOT NULL,
	`content` text NOT NULL,
	`embedding` F32_BLOB(1536),
	`createdAt` integer DEFAULT '"2025-12-22T01:07:40.572Z"' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `file` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`projectId` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`fileType` text DEFAULT 'meeting_notes',
	`parentFileId` integer,
	`aiGenerated` integer DEFAULT false,
	`createdAt` integer DEFAULT '"2025-12-22T01:07:40.570Z"' NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `meeting_note` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`fileId` integer NOT NULL,
	`projectId` integer NOT NULL,
	`recordingId` integer,
	`title` text NOT NULL,
	`summary` text,
	`keyPoints` text,
	`decisions` text,
	`actionItems` text,
	`participants` text,
	`rawTranscription` text,
	`formattedMinutes` text,
	`agendaItems` text,
	`discussionDetails` text,
	`nextMeeting` text,
	`additionalNotes` text,
	`meetingDate` integer,
	`duration` integer,
	`shareToken` text,
	`createdAt` integer DEFAULT '"2025-12-22T01:07:40.571Z"' NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fileId`) REFERENCES `file`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recordingId`) REFERENCES `recording`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`context` text,
	`color` text DEFAULT '#007AFF',
	`isArchived` integer DEFAULT false,
	`createdAt` integer DEFAULT '"2025-12-22T01:07:40.570Z"' NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `recording` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`projectId` integer,
	`fileId` integer,
	`audioUrl` text NOT NULL,
	`audioKey` text NOT NULL,
	`duration` integer,
	`transcription` text,
	`structuredNotes` text,
	`status` text DEFAULT 'uploading',
	`createdAt` integer DEFAULT '"2025-12-22T01:07:40.571Z"' NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fileId`) REFERENCES `file`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reminder` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`taskId` integer NOT NULL,
	`userId` text NOT NULL,
	`reminderType` text NOT NULL,
	`scheduledAt` integer NOT NULL,
	`isSent` integer DEFAULT false,
	`sentAt` integer,
	`createdAt` integer DEFAULT '"2025-12-22T01:07:40.571Z"' NOT NULL,
	FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `subscription` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`stripeCustomerId` text,
	`stripeSubscriptionId` text,
	`stripePriceId` text,
	`status` text NOT NULL,
	`currentPeriodEnd` integer,
	`createdAt` integer DEFAULT '"2025-12-22T01:07:40.572Z"' NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_userId_unique` ON `subscription` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_stripeCustomerId_unique` ON `subscription` (`stripeCustomerId`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_stripeSubscriptionId_unique` ON `subscription` (`stripeSubscriptionId`);--> statement-breakpoint
CREATE TABLE `task_candidate` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`recordingId` integer NOT NULL,
	`suggestedProjectId` integer,
	`suggestedFileId` integer,
	`title` text NOT NULL,
	`description` text,
	`suggestedDueDate` integer,
	`suggestedPriority` text DEFAULT 'medium',
	`aiConfidence` integer,
	`isApproved` integer,
	`createdAt` integer DEFAULT '"2025-12-22T01:07:40.571Z"' NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recordingId`) REFERENCES `recording`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`suggestedProjectId`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`suggestedFileId`) REFERENCES `file`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`projectId` integer,
	`fileId` integer,
	`meetingNoteId` integer,
	`recordingId` integer,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending',
	`priority` text DEFAULT 'medium',
	`dueDate` integer,
	`completedAt` integer,
	`aiGenerated` integer DEFAULT false,
	`aiConfidence` integer,
	`createdAt` integer DEFAULT '"2025-12-22T01:07:40.571Z"' NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fileId`) REFERENCES `file`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`meetingNoteId`) REFERENCES `meeting_note`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recordingId`) REFERENCES `recording`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
