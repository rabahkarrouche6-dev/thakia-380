CREATE TABLE `authorityOperationalAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorityId` int NOT NULL,
	`tenderId` int,
	`eventKey` varchar(180) NOT NULL,
	`type` enum('authority_approved','tender_published','tender_closed','evaluation_started') NOT NULL,
	`severity` enum('success','info','warning') NOT NULL DEFAULT 'info',
	`title` varchar(180) NOT NULL,
	`message` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `authorityOperationalAlerts_id` PRIMARY KEY(`id`),
	CONSTRAINT `authorityOperationalAlerts_eventKey_unique` UNIQUE(`eventKey`)
);
--> statement-breakpoint
CREATE INDEX `authority_operational_alerts_authority_created_idx` ON `authorityOperationalAlerts` (`authorityId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `authority_operational_alerts_authority_read_idx` ON `authorityOperationalAlerts` (`authorityId`,`readAt`);