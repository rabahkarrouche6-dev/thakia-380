CREATE TABLE `operatorDeclarations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`declarationType` varchar(80) NOT NULL,
	`textVersion` varchar(32) NOT NULL,
	`acceptedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operatorDeclarations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operatorDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentType` varchar(80) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`sha256` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operatorDocuments_id` PRIMARY KEY(`id`),
	CONSTRAINT `operatorDocuments_storageKey_unique` UNIQUE(`storageKey`)
);
--> statement-breakpoint
CREATE TABLE `operatorProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`operatorType` varchar(80) NOT NULL,
	`legalName` varchar(255) NOT NULL,
	`wilayaCode` varchar(2),
	`taxCenterType` varchar(8),
	`activityCodes` text,
	`representativeName` varchar(255),
	`representativeQuality` varchar(80),
	`nif` varchar(15),
	`nis` varchar(15),
	`rc` varchar(32),
	`taxArticle` varchar(11),
	`nin` varchar(18),
	`rib` varchar(20),
	`status` enum('draft','submitted') NOT NULL DEFAULT 'draft',
	`declarationVersion` varchar(32),
	`declaredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operatorProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `operatorProfiles_userId_unique` UNIQUE(`userId`)
);
