CREATE TABLE `bidDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bidId` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` varchar(1024) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bidDocuments_id` PRIMARY KEY(`id`),
	CONSTRAINT `bidDocuments_storageKey_unique` UNIQUE(`storageKey`)
);
--> statement-breakpoint
CREATE TABLE `tenderDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenderId` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` varchar(1024) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenderDocuments_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenderDocuments_storageKey_unique` UNIQUE(`storageKey`)
);
--> statement-breakpoint
ALTER TABLE `bids` MODIFY COLUMN `status` enum('draft','submitted','under_review','accepted','rejected') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `bids` MODIFY COLUMN `submittedAt` timestamp;--> statement-breakpoint
ALTER TABLE `bids` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;