-- V002 indexes the author column for the new by-author query path.
-- An index is DDL with the same lifecycle as any migration.
-- It runs after the table exists and records its own ledger row.
CREATE INDEX ex07_articles_author_idx ON ex07_articles (author);

-- => the index serves by-author lookups without touching the table shape
