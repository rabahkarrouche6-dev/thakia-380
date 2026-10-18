ALTER TABLE `bidOpeningMinutes` ADD `approvalStatus` enum('pending','approved') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `bidOpeningMinutes` ADD `approvedAt` timestamp;