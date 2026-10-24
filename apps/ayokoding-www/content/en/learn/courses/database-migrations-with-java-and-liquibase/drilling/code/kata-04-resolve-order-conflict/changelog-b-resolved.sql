-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The resolution: index the winner's table instead of duplicating it.
-- changeset kata:002-b-index-waypoints
-- => the replacement ships the loser's value without the loser's table
CREATE INDEX ix_waypoints_code ON waypoints (code);
-- => the index the duplicate skipped, applied onto the winner's table

-- rollback DROP INDEX ix_waypoints_code;
-- => dropping the index un-resolves back to the winner alone
