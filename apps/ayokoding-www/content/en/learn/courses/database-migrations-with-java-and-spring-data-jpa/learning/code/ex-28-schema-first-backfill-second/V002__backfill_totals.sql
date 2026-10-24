-- V002 adds the totals column and computes it from existing columns.
-- Backfill second: this file assumes V001's shape and fails loudly without it.
-- Dependency order is what makes the computation safe to write plainly.
ALTER TABLE ex28_line_items
ADD COLUMN total_cents INTEGER;

-- => nullable first: computed below, tightened only when proven full
UPDATE ex28_line_items
SET
  total_cents = quantity * unit_cents;

-- => every row derives its total from data the schema migration provided
