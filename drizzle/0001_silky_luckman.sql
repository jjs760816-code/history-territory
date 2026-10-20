CREATE TABLE `game_archives` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`result` text NOT NULL,
	`access` text NOT NULL,
	`ended_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_archives_code_unique` ON `game_archives` (`code`);