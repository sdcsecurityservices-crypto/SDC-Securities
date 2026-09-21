CREATE TABLE `demo_workspaces` (
	`owner` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL
);
