-- DROP INDEX statements removed as they may not exist in the database
-- The indexes will be created below if they don't exist
ALTER TABLE `bookmark` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-22T08:35:28.341Z"';--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `subscription_userId_unique` ON `subscription` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `subscription_stripeCustomerId_unique` ON `subscription` (`stripeCustomerId`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `subscription_stripeSubscriptionId_unique` ON `subscription` (`stripeSubscriptionId`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_setting_userId_unique` ON `user_setting` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `user` (`email`);--> statement-breakpoint
ALTER TABLE `calendar_event` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-22T08:35:28.342Z"';--> statement-breakpoint
ALTER TABLE `calendar_integration` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-22T08:35:28.342Z"';--> statement-breakpoint
ALTER TABLE `chat_conversation` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-22T08:35:28.342Z"';--> statement-breakpoint
ALTER TABLE `chat_message` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-22T08:35:28.342Z"';--> statement-breakpoint
ALTER TABLE `embedding` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-22T08:35:28.342Z"';--> statement-breakpoint
ALTER TABLE `file` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-22T08:35:28.341Z"';--> statement-breakpoint
ALTER TABLE `highlight` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-22T08:35:28.341Z"';--> statement-breakpoint
ALTER TABLE `meeting_note` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-22T08:35:28.341Z"';--> statement-breakpoint
ALTER TABLE `project` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-22T08:35:28.341Z"';--> statement-breakpoint
ALTER TABLE `recording` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-22T08:35:28.341Z"';--> statement-breakpoint
ALTER TABLE `reminder` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-22T08:35:28.342Z"';--> statement-breakpoint
ALTER TABLE `subscription` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-22T08:35:28.342Z"';--> statement-breakpoint
ALTER TABLE `task_candidate` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-22T08:35:28.342Z"';--> statement-breakpoint
ALTER TABLE `task` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-22T08:35:28.341Z"';--> statement-breakpoint
ALTER TABLE `user_setting` ALTER COLUMN "createdAt" TO "createdAt" integer NOT NULL DEFAULT '"2025-12-22T08:35:28.342Z"';