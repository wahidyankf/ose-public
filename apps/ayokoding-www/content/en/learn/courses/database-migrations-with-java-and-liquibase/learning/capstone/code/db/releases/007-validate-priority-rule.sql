-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Release 7 validates: the priority rule lands as a real constraint.
-- changeset course:007-validate-priority-rule
-- => rules belong at the boundary, so invalid totals fail loudly at insert
ALTER TABLE orders ADD CONSTRAINT ck_orders_priority CHECK (priority IN ('normal', 'high'));
-- => every stored value already obeys, so the rule locks in silently

-- rollback ALTER TABLE orders DROP CONSTRAINT ck_orders_priority;
-- => this reverse never runs here; the capstone ships forward only
