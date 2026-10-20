CREATE TABLE `game_rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`teacher_hash` text NOT NULL,
	`state` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
