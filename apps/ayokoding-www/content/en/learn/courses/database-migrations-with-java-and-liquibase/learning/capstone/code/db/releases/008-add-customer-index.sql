-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Release 8 speeds reads: the lookup index builds without locking writes.
-- changeset course:008-add-customer-index runInTransaction:false
-- => CONCURRENTLY forbids a transaction block, so this release opts out
-- => CONCURRENTLY keeps customer lookups fast while orders keep flowing
CREATE INDEX CONCURRENTLY ix_orders_customer ON orders (customer_id);
-- => the index is the last of eight rows the first check counts

-- rollback DROP INDEX ix_orders_customer;
-- => this reverse never runs here; the capstone ships forward only
