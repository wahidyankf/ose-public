-- 0003 step one: the new column arrives. -- => expansion, safe alone
ALTER TABLE customers -- => the old column stays exactly where it is
    ADD COLUMN full_name TEXT; -- => NULL until the copy fills it
