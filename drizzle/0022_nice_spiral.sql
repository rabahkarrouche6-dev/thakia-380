CREATE TABLE `aiAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int NOT NULL,
	`actorRole` varchar(40) NOT NULL,
	`featureCode` varchar(100) NOT NULL,
	`action` varchar(120) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` int,
	`policyDecision` varchar(40) NOT NULL,
	`result` varchar(40) NOT NULL,
	`modelUsed` int NOT NULL DEFAULT 0,
	`inputDigest` varchar(128),
	`outputDigest` varchar(128),
	`requestId` varchar(80),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smartTenderDocumentReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`versionId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`decision` enum('pending','approved','changes_requested','rejected') NOT NULL DEFAULT 'pending',
	`notes` text,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `smartTenderDocumentReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smartTenderDocumentVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`contentJson` text NOT NULL,
	`contentDigest` varchar(128) NOT NULL,
	`createdBy` int NOT NULL,
	`source` enum('human','ai_assisted') NOT NULL DEFAULT 'human',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `smartTenderDocumentVersions_id` PRIMARY KEY(`id`),
	CONSTRAINT `smart_tender_document_versions_unique` UNIQUE(`documentId`,`versionNumber`)
);
--> statement-breakpoint
CREATE TABLE `smartTenderDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`authorityId` int,
	`tenderId` int,
	`audience` enum('supplier','authority') NOT NULL,
	`title` varchar(255) NOT NULL,
	`status` enum('draft','in_review','approved','archived') NOT NULL DEFAULT 'draft',
	`completion` int NOT NULL DEFAULT 0,
	`currentVersionNumber` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smartTenderDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ai_audit_logs_actor_created_idx` ON `aiAuditLogs` (`actorId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ai_audit_logs_feature_created_idx` ON `aiAuditLogs` (`featureCode`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ai_audit_logs_entity_created_idx` ON `aiAuditLogs` (`entityType`,`entityId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `smart_tender_document_reviews_document_idx` ON `smartTenderDocumentReviews` (`documentId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `smart_tender_document_reviews_reviewer_idx` ON `smartTenderDocumentReviews` (`reviewerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `smart_tender_document_versions_created_idx` ON `smartTenderDocumentVersions` (`documentId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `smart_tender_documents_owner_status_idx` ON `smartTenderDocuments` (`ownerId`,`status`);--> statement-breakpoint
CREATE INDEX `smart_tender_documents_authority_status_idx` ON `smartTenderDocuments` (`authorityId`,`status`);--> statement-breakpoint
CREATE INDEX `smart_tender_documents_tender_idx` ON `smartTenderDocuments` (`tenderId`);