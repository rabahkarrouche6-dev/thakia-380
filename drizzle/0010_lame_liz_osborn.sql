CREATE TABLE `bidOpeningCommitteeMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenderId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('chair','member','secretary') NOT NULL DEFAULT 'member',
	`appointedBy` int NOT NULL,
	`appointedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `bidOpeningCommitteeMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `bid_opening_committee_tender_user_unique` UNIQUE(`tenderId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `bidOpeningMinutes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`tenderId` int NOT NULL,
	`generatedBy` int NOT NULL,
	`content` text NOT NULL,
	`contentDigest` varchar(128) NOT NULL,
	`sealedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bidOpeningMinutes_id` PRIMARY KEY(`id`),
	CONSTRAINT `bidOpeningMinutes_sessionId_unique` UNIQUE(`sessionId`),
	CONSTRAINT `bidOpeningMinutes_tenderId_unique` UNIQUE(`tenderId`)
);
--> statement-breakpoint
CREATE INDEX `bid_opening_committee_tender_active_idx` ON `bidOpeningCommitteeMembers` (`tenderId`,`revokedAt`);--> statement-breakpoint
CREATE INDEX `bid_opening_minutes_tender_sealed_idx` ON `bidOpeningMinutes` (`tenderId`,`sealedAt`);