-- 0002 stale: written against a renamed column. -- => total does not exist yet
ALTER TABLE orders -- => the stale assumption breaks here
    ADD COLUMN total_plus_tax INTEGER GENERATED ALWAYS AS (total * 2) STORED; -- => total was renamed to amount on main
