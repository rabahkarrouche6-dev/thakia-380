CREATE TABLE `assistantAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`threadId` int,
	`messageId` int,
	`actionType` enum('ask','retrieve','answer','block','escalate') NOT NULL,
	`intentLabel` varchar(80),
	`riskLevel` enum('low','medium','high') NOT NULL DEFAULT 'low',
	`retrievedChunkCount` int NOT NULL DEFAULT 0,
	`modelName` varchar(120),
	`latencyMs` int,
	`decisionJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assistantAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assistantFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` enum('useful','not_useful') NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assistantFeedback_id` PRIMARY KEY(`id`),
	CONSTRAINT `assistant_feedback_message_user_unique` UNIQUE(`messageId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `assistantMessageRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`senderType` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`normalizedContent` text,
	`citationsJson` text,
	`tokenUsageInput` int,
	`tokenUsageOutput` int,
	`finishReason` varchar(80),
	`blockedReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assistantMessageRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assistantPolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`roleCode` varchar(40) NOT NULL,
	`policyType` enum('retrieval','answer','action','redaction') NOT NULL,
	`policyJson` text NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assistantPolicies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assistantProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(80) NOT NULL,
	`name` varchar(255) NOT NULL,
	`scopeType` enum('global','operator','authority','central_admin','contextual') NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`defaultModel` varchar(120),
	`systemPromptKey` varchar(120) NOT NULL,
	`allowActions` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assistantProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `assistantProfiles_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `assistantThreads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`userId` int NOT NULL,
	`tenantId` varchar(120),
	`organizationId` int,
	`roleCode` varchar(40) NOT NULL,
	`contextType` enum('tender','specification','bid','evaluation','help_center') NOT NULL,
	`contextObjectId` int,
	`title` varchar(255) NOT NULL,
	`status` enum('open','closed','archived') NOT NULL DEFAULT 'open',
	`lastMessageAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assistantThreads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeChunks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`chunkIndex` int NOT NULL,
	`chunkText` text NOT NULL,
	`embeddingRef` varchar(255),
	`metadataJson` text,
	`tenantId` varchar(120),
	`organizationId` int,
	`roleWhitelistJson` text,
	`entityWhitelistJson` text,
	`contextType` varchar(80),
	`contextObjectId` int,
	`documentType` varchar(120),
	`legalBasis` varchar(255),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledgeChunks_id` PRIMARY KEY(`id`),
	CONSTRAINT `knowledge_chunks_source_index_unique` UNIQUE(`sourceId`,`chunkIndex`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(120),
	`organizationId` int,
	`sourceType` enum('law','faq','guide','tender_doc','internal_policy','pricing_reference') NOT NULL,
	`title` varchar(255) NOT NULL,
	`language` varchar(12) NOT NULL,
	`file` varchar(1024),
	`sourceStatus` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`effectiveFrom` timestamp,
	`effectiveTo` timestamp,
	`confidentialityLevel` enum('public','internal','restricted') NOT NULL DEFAULT 'internal',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledgeSources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `assistant_audit_user_action_idx` ON `assistantAuditLogs` (`userId`,`actionType`,`createdAt`);--> statement-breakpoint
CREATE INDEX `assistant_messages_thread_created_idx` ON `assistantMessageRecords` (`threadId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `assistant_policies_profile_role_idx` ON `assistantPolicies` (`profileId`,`roleCode`,`policyType`);--> statement-breakpoint
CREATE INDEX `assistant_threads_user_status_idx` ON `assistantThreads` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `assistant_threads_context_idx` ON `assistantThreads` (`contextType`,`contextObjectId`);--> statement-breakpoint
CREATE INDEX `knowledge_chunks_retrieval_scope_idx` ON `knowledgeChunks` (`organizationId`,`contextType`,`contextObjectId`);--> statement-breakpoint
CREATE INDEX `knowledge_sources_scope_status_idx` ON `knowledgeSources` (`organizationId`,`sourceStatus`);