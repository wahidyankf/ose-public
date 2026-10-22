-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-legacy-invoices
-- => the changeset describes the hand-built table column for column
-- => it must never execute here: the table already exists, so the sync
-- => marks it ran and every future changeset builds on top normally
CREATE TABLE legacy_invoices (
  id SERIAL PRIMARY KEY,
  -- => SERIAL matches the hand-built key exactly, or drift starts today
  total_cents INTEGER NOT NULL
  -- => the hand-built column is nullable; the baseline tightens nothing
);

-- rollback DROP TABLE legacy_invoices;
-- => this reverse never runs here; baselines record, they do not execute
