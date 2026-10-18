ALTER TABLE `auditLogs` ADD `actorRole` varchar(40) NULL;
--> statement-breakpoint
UPDATE `auditLogs` AS a INNER JOIN `users` AS u ON u.`id` = a.`actorId` SET a.`actorRole` = u.`role` WHERE a.`actorRole` IS NULL;
--> statement-breakpoint
ALTER TABLE `auditLogs` MODIFY `actorRole` varchar(40) NOT NULL;
--> statement-breakpoint
