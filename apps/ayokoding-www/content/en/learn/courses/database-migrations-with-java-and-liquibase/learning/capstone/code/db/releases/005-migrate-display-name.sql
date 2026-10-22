-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Release 5 migrates: every customer's value copies to the new name.
-- changeset course:005-migrate-display-name
-- => the copy must land before the contract below removes the source
UPDATE customers SET display_name = name;
-- => two copied values: the checks below recount them under the new name

-- rollback UPDATE customers SET display_name = NULL;
-- => this reverse never runs here; the capstone ships forward only
