CREATE TABLE `supplierContracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenderId` int NOT NULL,
	`winningBidId` int NOT NULL,
	`supplierId` int NOT NULL,
	`contractReference` varchar(120) NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'DZD',
	`status` enum('pending_signature','active','completed','suspended','terminated') NOT NULL DEFAULT 'pending_signature',
	`awardedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplierContracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `supplierContracts_tenderId_unique` UNIQUE(`tenderId`),
	CONSTRAINT `supplierContracts_winningBidId_unique` UNIQUE(`winningBidId`),
	CONSTRAINT `supplierContracts_contractReference_unique` UNIQUE(`contractReference`)
);
--> statement-breakpoint
CREATE TABLE `supplierOperationalAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`contractId` int,
	`tenderId` int,
	`eventKey` varchar(180) NOT NULL,
	`type` enum('contract_awarded','contract_status','tender_deadline') NOT NULL,
	`severity` enum('success','info','warning') NOT NULL DEFAULT 'info',
	`title` varchar(180) NOT NULL,
	`message` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplierOperationalAlerts_id` PRIMARY KEY(`id`),
	CONSTRAINT `supplierOperationalAlerts_eventKey_unique` UNIQUE(`eventKey`)
);
--> statement-breakpoint
CREATE INDEX `supplier_contracts_supplier_status_idx` ON `supplierContracts` (`supplierId`,`status`);--> statement-breakpoint
CREATE INDEX `supplier_contracts_supplier_awarded_idx` ON `supplierContracts` (`supplierId`,`awardedAt`);--> statement-breakpoint
CREATE INDEX `supplier_operational_alerts_supplier_created_idx` ON `supplierOperationalAlerts` (`supplierId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `supplier_operational_alerts_supplier_read_idx` ON `supplierOperationalAlerts` (`supplierId`,`readAt`);