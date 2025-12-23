DROP INDEX "booking_setting_token_unique";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "subscription_userId_unique";--> statement-breakpoint
DROP INDEX "subscription_stripeCustomerId_unique";--> statement-breakpoint
DROP INDEX "subscription_stripeSubscriptionId_unique";--> statement-breakpoint
DROP INDEX "user_setting_userId_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
ALTER TABLE `audit_log` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.939Z"';--> statement-breakpoint
CREATE UNIQUE INDEX `booking_setting_token_unique` ON `booking_setting` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_userId_unique` ON `subscription` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_stripeCustomerId_unique` ON `subscription` (`stripeCustomerId`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_stripeSubscriptionId_unique` ON `subscription` (`stripeSubscriptionId`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_setting_userId_unique` ON `user_setting` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
ALTER TABLE `booking_setting` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.939Z"';--> statement-breakpoint
ALTER TABLE `booking` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.939Z"';--> statement-breakpoint
ALTER TABLE `bookmark` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.937Z"';--> statement-breakpoint
ALTER TABLE `calendar_event` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.938Z"';--> statement-breakpoint
ALTER TABLE `calendar_integration` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.938Z"';--> statement-breakpoint
ALTER TABLE `chat_conversation` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.937Z"';--> statement-breakpoint
ALTER TABLE `chat_message` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.938Z"';--> statement-breakpoint
ALTER TABLE `comment` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.938Z"';--> statement-breakpoint
ALTER TABLE `custom_prompt` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.938Z"';--> statement-breakpoint
ALTER TABLE `embedding` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.938Z"';--> statement-breakpoint
ALTER TABLE `file` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.937Z"';--> statement-breakpoint
ALTER TABLE `highlight` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.937Z"';--> statement-breakpoint
ALTER TABLE `integration` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.939Z"';--> statement-breakpoint
ALTER TABLE `meeting_note` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.937Z"';--> statement-breakpoint
ALTER TABLE `project` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.937Z"';--> statement-breakpoint
ALTER TABLE `recording_segment` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.939Z"';--> statement-breakpoint
ALTER TABLE `recording` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.937Z"';--> statement-breakpoint
ALTER TABLE `reminder` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.937Z"';--> statement-breakpoint
ALTER TABLE `snippet` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.938Z"';--> statement-breakpoint
ALTER TABLE `subscription` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.938Z"';--> statement-breakpoint
ALTER TABLE `summary_template` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.938Z"';--> statement-breakpoint
ALTER TABLE `task_candidate` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.937Z"';--> statement-breakpoint
ALTER TABLE `task` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.937Z"';--> statement-breakpoint
ALTER TABLE `transcript_segment` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.937Z"';--> statement-breakpoint
ALTER TABLE `user_setting` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.938Z"';--> statement-breakpoint
ALTER TABLE `user_setting` ADD `primaryColor` text DEFAULT '#00D4AA';--> statement-breakpoint
ALTER TABLE `user_setting` ADD `accentColor` text DEFAULT '#0D7377';--> statement-breakpoint
ALTER TABLE `weekly_report` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-23T00:51:12.938Z"';