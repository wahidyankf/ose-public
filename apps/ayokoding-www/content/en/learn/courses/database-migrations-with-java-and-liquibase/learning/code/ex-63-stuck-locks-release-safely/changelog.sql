-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => No changeset runs here: the lock rescue needs no schema of its own.
-- => The file exists so the Liquibase handle has a changelog to hold.
-- changeset course:001-lock-rescue-marker
-- => a marker changeset keeps the handle valid without building anything
CREATE TABLE IF NOT EXISTS lock_rescue_log (id SERIAL PRIMARY KEY);

-- => the marker table records that a rescue happened on this database
-- rollback DROP TABLE lock_rescue_log;
-- => this reverse never runs here; rescues release locks, not tables
