-- 0003: the new column arrives empty. -- => readers adopt it after the copy
ALTER TABLE users -- => the old column stays exactly where it is
    ADD COLUMN full_name TEXT; -- => NULL until the copy fills it
