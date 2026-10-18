CREATE INDEX `audit_logs_created_at_idx` ON `auditLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `bids_tender_status_idx` ON `bids` (`tenderId`,`status`);--> statement-breakpoint
CREATE INDEX `tenders_status_deadline_idx` ON `tenders` (`status`,`deadline`);--> statement-breakpoint
CREATE INDEX `tenders_authority_status_idx` ON `tenders` (`authorityId`,`status`);