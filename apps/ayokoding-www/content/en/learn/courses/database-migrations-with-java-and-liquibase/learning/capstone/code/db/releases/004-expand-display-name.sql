-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Release 4 expands: the display_name column lands beside name.
-- changeset course:004-expand-display-name
-- => the new name arrives nullable while old readers still use name
ALTER TABLE customers ADD COLUMN display_name VARCHAR(60);
-- => expansion is pure addition: nothing existing can trip over it

-- rollback ALTER TABLE customers DROP COLUMN display_name;
-- => this reverse never runs here; the capstone ships forward only
