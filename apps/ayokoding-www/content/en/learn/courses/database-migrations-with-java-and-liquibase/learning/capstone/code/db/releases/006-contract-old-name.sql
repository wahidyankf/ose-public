-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Release 6 contracts: the old name leaves once nothing reads it.
-- changeset course:006-contract-old-name
-- => separation travels in order: add new, backfill, retire old
ALTER TABLE customers DROP COLUMN name;
-- => dropping last keeps every reader working through the whole rename

-- rollback ALTER TABLE customers ADD COLUMN name VARCHAR(60);
-- => this reverse never runs here; the capstone ships forward only
