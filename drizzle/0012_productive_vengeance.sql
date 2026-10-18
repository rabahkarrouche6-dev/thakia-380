CREATE TABLE `bidOpeningMinutesSignatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`minutesId` int NOT NULL,
	`tenderId` int NOT NULL,
	`userId` int NOT NULL,
	`memberRole` enum('chair','member','secretary') NOT NULL,
	`signatureAlgorithm` varchar(40) NOT NULL DEFAULT 'SHA256-IDENTITY-BOUND',
	`signatureDigest` varchar(128) NOT NULL,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bidOpeningMinutesSignatures_id` PRIMARY KEY(`id`),
	CONSTRAINT `bid_opening_minutes_signatures_minutes_user_unique` UNIQUE(`minutesId`,`userId`)
);
--> statement-breakpoint
CREATE INDEX `bid_opening_minutes_signatures_tender_signed_idx` ON `bidOpeningMinutesSignatures` (`tenderId`,`signedAt`);