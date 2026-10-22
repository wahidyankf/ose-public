-- V2: grading arrives after the import.
ALTER TABLE legacy_coffee ADD COLUMN grade TEXT;
UPDATE legacy_coffee SET grade = 'A';
