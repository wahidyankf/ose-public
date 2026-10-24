-- 0003: contraction lands last. -- => safe only after readers moved
ALTER TABLE customers -- => the table keeps every row it holds
    DROP COLUMN name; -- => the old column leaves; the new one stays
