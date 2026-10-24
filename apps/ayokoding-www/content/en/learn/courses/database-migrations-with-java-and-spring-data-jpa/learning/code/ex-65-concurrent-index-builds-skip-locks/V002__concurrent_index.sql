-- no-transaction
-- V002 builds the title index concurrently: no write lock, traffic flows.
-- CONCURRENTLY cannot run inside a transaction, so this file opts out.
-- The runner executes it autocommitted and still records the ledger row.
CREATE INDEX CONCURRENTLY ex65_searchable_title_idx ON ex65_searchable (title);

-- => the index serves title lookups without ever queueing writers
