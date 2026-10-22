-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Release 3 backfills the priority column from each order's total.
-- changeset course:003-backfill-priority
-- => schema and data travel together: the column lands derived, never null
ALTER TABLE orders ADD COLUMN priority VARCHAR(20);
-- => the column arrives nullable; the update below fills every row at once
UPDATE orders SET priority = CASE WHEN total_cents >= 10000 THEN 'high' ELSE 'normal' END;
-- => one high order and one normal order: the checks below recount them

-- rollback ALTER TABLE orders DROP COLUMN priority;
-- => this reverse never runs here; the capstone ships forward only
