-- V2: priority ranks the queue.
ALTER TABLE tickets ADD COLUMN priority INTEGER NOT NULL DEFAULT 3;
