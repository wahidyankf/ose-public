-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The changeset describes the hand-built table column for column.
-- changeset kata:001-legacy-ledgers
-- => it must never execute here: the table already exists, so the sync
-- => marks it ran and every future changeset builds on top normally
CREATE TABLE legacy_ledgers (
  id SERIAL PRIMARY KEY,
  -- => SERIAL matches the hand-built key exactly, or drift starts today
  balance_cents INTEGER NOT NULL
  -- => the hand-built column the sync below carries over untouched
);

-- rollback DROP TABLE legacy_ledgers;
-- => this reverse never runs here; baselines record, they do not execute
