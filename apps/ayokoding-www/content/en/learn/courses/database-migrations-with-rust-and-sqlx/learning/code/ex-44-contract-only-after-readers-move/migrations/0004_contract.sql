-- 0004: contraction removes the legacy shape. -- => safe only after readers moved
DROP VIEW authors_full; -- => the bridge retires first
ALTER TABLE authors -- => the table keeps its modern shape
    DROP COLUMN bio; -- => the legacy column leaves last
