CREATE TABLE `assistantMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`context` varchar(120) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assistantMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` int,
	`result` varchar(40) NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `awardDecisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenderId` int NOT NULL,
	`winningBidId` int,
	`decidedBy` int NOT NULL,
	`decision` enum('awarded','cancelled') NOT NULL,
	`notes` text,
	`decidedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `awardDecisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `awardDecisions_tenderId_unique` UNIQUE(`tenderId`)
);
--> statement-breakpoint
CREATE TABLE `bids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenderId` int NOT NULL,
	`supplierId` int NOT NULL,
	`amount` int NOT NULL,
	`proposal` text NOT NULL,
	`status` enum('submitted','under_review','accepted','rejected') NOT NULL DEFAULT 'submitted',
	`evaluationNote` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`evaluatedAt` timestamp,
	CONSTRAINT `bids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`organizationName` varchar(255),
	`registrationNumber` varchar(120),
	`phone` varchar(40),
	`address` text,
	`completion` int NOT NULL DEFAULT 40,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `tenders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorityId` int NOT NULL,
	`reference` varchar(80) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(120) NOT NULL,
	`budget` int,
	`currency` varchar(10) NOT NULL DEFAULT 'DZD',
	`location` varchar(160),
	`deadline` timestamp NOT NULL,
	`status` enum('draft','published','closed','evaluation','awarded','cancelled') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`publishedAt` timestamp,
	`closedAt` timestamp,
	CONSTRAINT `tenders_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenders_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','supplier','authority','regulator') NOT NULL DEFAULT 'user';