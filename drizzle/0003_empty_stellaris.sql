CREATE TABLE `bidOpeningSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenderId` int NOT NULL,
	`status` enum('opened') NOT NULL DEFAULT 'opened',
	`scheduledAt` timestamp NOT NULL,
	`openedAt` timestamp NOT NULL,
	`openedBy` int NOT NULL,
	`submittedCount` int NOT NULL DEFAULT 0,
	`minutes` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bidOpeningSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `bidOpeningSessions_tenderId_unique` UNIQUE(`tenderId`)
);
--> statement-breakpoint
ALTER TABLE `bids` ADD `openedAt` timestamp;