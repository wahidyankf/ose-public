-- V3: dark by default, one pilot row lit.
ALTER TABLE reports ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT false;
UPDATE reports SET enabled = true WHERE title = 'daily';
