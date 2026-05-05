CREATE TABLE `generationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`stage` varchar(100) NOT NULL,
	`historyStatus` enum('STARTED','IN_PROGRESS','COMPLETED','FAILED') NOT NULL,
	`progressPercentage` int DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectInputs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userIdea` text,
	`referenceImageUrl` varchar(500),
	`referenceImageStorageKey` varchar(255),
	`numClips` int NOT NULL,
	`clipDurationSeconds` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectInputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`synopsis` text,
	`status` enum('CREATED','STRUCTURED','PROMPTS_GENERATED','STORYBOARD_GENERATED','NARRATION_GENERATED','VIDEO_GENERATED','COMPLETED','FAILED') NOT NULL DEFAULT 'CREATED',
	`finalVideoUrl` varchar(500),
	`finalVideoStorageKey` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sceneNumber` int NOT NULL,
	`title` varchar(255),
	`description` text,
	`dialogue` text,
	`visualElements` json,
	`mood` varchar(100),
	`durationSeconds` int,
	`videoPrompt` text,
	`imagePrompt` text,
	`styleParameters` json,
	`storyboardImageUrl` varchar(500),
	`storyboardStorageKey` varchar(255),
	`narrationAudioUrl` varchar(500),
	`narrationStorageKey` varchar(255),
	`videoClipUrl` varchar(500),
	`videoStorageKey` varchar(255),
	`sceneStatus` enum('PENDING','PROMPTS_READY','STORYBOARD_GENERATED','NARRATION_GENERATED','VIDEO_GENERATED','COMPLETED') NOT NULL DEFAULT 'PENDING',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scenes_id` PRIMARY KEY(`id`)
);
