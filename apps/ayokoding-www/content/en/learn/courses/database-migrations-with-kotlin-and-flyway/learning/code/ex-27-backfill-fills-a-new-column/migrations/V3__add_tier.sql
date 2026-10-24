-- V3: new column plus immediate backfill in one file.
ALTER TABLE users ADD COLUMN tier TEXT;
UPDATE users SET tier = 'free';
