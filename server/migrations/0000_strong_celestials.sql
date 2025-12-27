CREATE TABLE `tracked_changes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`operation` enum('insert','update','delete') NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`changed_at` timestamp NOT NULL DEFAULT (now()),
	`processed` boolean NOT NULL DEFAULT false,
	CONSTRAINT `tracked_changes_id` PRIMARY KEY(`id`)
);
