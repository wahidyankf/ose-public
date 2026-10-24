-- 0004: strictness lands last. -- => safe only because no nulls remain
ALTER TABLE profiles -- => the table keeps every backfilled row
    ALTER COLUMN handle SET NOT NULL; -- => the constraint the sequence earned
