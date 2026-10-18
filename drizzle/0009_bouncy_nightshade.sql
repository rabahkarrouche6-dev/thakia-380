CREATE TABLE `billingEventLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventKey` varchar(180) NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`accountUserId` int,
	`subscriptionId` int,
	`result` varchar(40) NOT NULL,
	`payloadHash` varchar(128),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billingEventLogs_id` PRIMARY KEY(`id`),
	CONSTRAINT `billingEventLogs_eventKey_unique` UNIQUE(`eventKey`)
);
--> statement-breakpoint
CREATE TABLE `featureUsageLedger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountUserId` int NOT NULL,
	`featureCode` varchar(100) NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`units` int NOT NULL DEFAULT 0,
	`lastEventAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `featureUsageLedger_id` PRIMARY KEY(`id`),
	CONSTRAINT `usage_account_feature_window_unique` UNIQUE(`accountUserId`,`featureCode`,`periodStart`)
);
--> statement-breakpoint
CREATE TABLE `paymentTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`provider` varchar(60) NOT NULL,
	`idempotencyKey` varchar(140) NOT NULL,
	`providerReference` varchar(180),
	`status` enum('initiated','pending','succeeded','failed','reversed') NOT NULL DEFAULT 'initiated',
	`amountDzd` int NOT NULL,
	`rawReferenceHash` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentTransactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `paymentTransactions_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `planFeatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`featureCode` varchar(100) NOT NULL,
	`entitlementType` enum('boolean','quota','seats','configuration') NOT NULL,
	`enabled` int NOT NULL DEFAULT 0,
	`quotaLimit` int,
	`seatLimit` int,
	`configurationJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planFeatures_id` PRIMARY KEY(`id`),
	CONSTRAINT `plan_features_plan_code_unique` UNIQUE(`planId`,`featureCode`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(80) NOT NULL,
	`nameAr` varchar(160) NOT NULL,
	`audience` enum('supplier','authority') NOT NULL,
	`billingCycle` enum('free','monthly','yearly') NOT NULL,
	`priceDzd` int NOT NULL DEFAULT 0,
	`annualSavingsPercent` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`isArchived` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `plans_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionEntitlementSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionId` int NOT NULL,
	`featureCode` varchar(100) NOT NULL,
	`entitlementType` enum('boolean','quota','seats','configuration') NOT NULL,
	`enabled` int NOT NULL DEFAULT 0,
	`quotaLimit` int,
	`seatLimit` int,
	`configurationJson` text,
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscriptionEntitlementSnapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_entitlement_feature_unique` UNIQUE(`subscriptionId`,`featureCode`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionInvoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionId` int NOT NULL,
	`invoiceNumber` varchar(80) NOT NULL,
	`status` enum('draft','issued','paid','void','uncollectible') NOT NULL DEFAULT 'draft',
	`amountDzd` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'DZD',
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`pdfStorageKey` varchar(512),
	`issuedAt` timestamp,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscriptionInvoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptionInvoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountUserId` int NOT NULL,
	`planId` int NOT NULL,
	`status` enum('pending','trialing','active','past_due','grace','cancelled','expired') NOT NULL DEFAULT 'pending',
	`startsAt` timestamp NOT NULL,
	`currentPeriodStart` timestamp NOT NULL,
	`currentPeriodEnd` timestamp NOT NULL,
	`cancelAtPeriodEnd` int NOT NULL DEFAULT 0,
	`cancelledAt` timestamp,
	`graceEndsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_accountUserId_unique` UNIQUE(`accountUserId`)
);
--> statement-breakpoint
CREATE INDEX `billing_event_type_created_idx` ON `billingEventLogs` (`eventType`,`createdAt`);--> statement-breakpoint
CREATE INDEX `payment_provider_reference_idx` ON `paymentTransactions` (`provider`,`providerReference`);--> statement-breakpoint
CREATE INDEX `plan_features_code_idx` ON `planFeatures` (`featureCode`);--> statement-breakpoint
CREATE INDEX `subscriptions_status_period_idx` ON `subscriptions` (`status`,`currentPeriodEnd`);