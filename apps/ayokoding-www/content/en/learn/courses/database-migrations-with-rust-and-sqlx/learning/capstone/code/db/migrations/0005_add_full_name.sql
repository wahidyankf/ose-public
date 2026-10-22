-- 0005 rename step one: the new column arrives. -- => expansion before contraction
ALTER TABLE customers -- => the old name stays exactly where it is
    ADD COLUMN full_name TEXT; -- => NULL until the backfill twins it
