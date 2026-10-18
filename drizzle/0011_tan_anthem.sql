ALTER TABLE `bidOpeningSessions` MODIFY COLUMN `status` enum('scheduled','opened','sealed') NOT NULL DEFAULT 'scheduled';--> statement-breakpoint
ALTER TABLE `bidOpeningSessions` MODIFY COLUMN `openedAt` timestamp;--> statement-breakpoint
ALTER TABLE `bidOpeningSessions` MODIFY COLUMN `openedBy` int;--> statement-breakpoint
ALTER TABLE `bidOpeningSessions` MODIFY COLUMN `minutes` text;