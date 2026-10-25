-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Billing's file sorts first under includeAll.
-- changeset billing:billing-001-make-invoices
-- => the billing team owns the billing id space: every id starts there
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  total_cents INTEGER NOT NULL
  -- => invoice totals are required from the first migration
);

-- rollback DROP TABLE invoices;
-- => each team file carries its own reverse, as before the merge
