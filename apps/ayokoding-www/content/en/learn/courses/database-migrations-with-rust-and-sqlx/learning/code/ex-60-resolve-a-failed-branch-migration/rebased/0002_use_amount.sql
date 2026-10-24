-- 0002 rebased: built on the current schema. -- => the branch, healed
ALTER TABLE orders -- => the current column name, not the stale one
    ADD COLUMN total_plus_tax INTEGER GENERATED ALWAYS AS (amount * 2) STORED; -- => derived from what exists
