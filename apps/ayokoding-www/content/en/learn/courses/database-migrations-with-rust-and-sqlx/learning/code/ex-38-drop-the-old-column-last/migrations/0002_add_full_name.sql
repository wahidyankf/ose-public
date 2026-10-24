-- 0002: the new column arrives. -- => expansion before contraction
ALTER TABLE customers -- => the old column stays exactly where it is
    ADD COLUMN full_name TEXT NOT NULL DEFAULT 'unknown'; -- => defaulted so no copy is needed here
