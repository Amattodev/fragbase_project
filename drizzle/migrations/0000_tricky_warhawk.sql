CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`filePath` text NOT NULL,
	`contentType` text NOT NULL,
	`expiresAt` text NOT NULL,
	`createdAt` text NOT NULL
);
