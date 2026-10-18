CREATE TABLE `upgradeRequestNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountUserId` int NOT NULL,
	`eventKey` varchar(180) NOT NULL,
	`planCode` varchar(80) NOT NULL,
	`audience` enum('supplier','authority') NOT NULL,
	`status` enum('pending_contact','approved','rejected','needs_info') NOT NULL DEFAULT 'pending_contact',
	`title` varchar(180) NOT NULL,
	`message` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `upgradeRequestNotifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `upgradeRequestNotifications_eventKey_unique` UNIQUE(`eventKey`)
);
--> statement-breakpoint
CREATE INDEX `upgrade_notifications_account_created_idx` ON `upgradeRequestNotifications` (`accountUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `upgrade_notifications_account_read_idx` ON `upgradeRequestNotifications` (`accountUserId`,`readAt`);