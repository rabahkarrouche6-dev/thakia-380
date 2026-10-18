CREATE TABLE `adminDelegations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminUserId` int NOT NULL,
	`authorityUserId` int NOT NULL,
	`scope` enum('manage','decide') NOT NULL,
	`reason` varchar(500) NOT NULL,
	`startsAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminDelegations_id` PRIMARY KEY(`id`)
);
