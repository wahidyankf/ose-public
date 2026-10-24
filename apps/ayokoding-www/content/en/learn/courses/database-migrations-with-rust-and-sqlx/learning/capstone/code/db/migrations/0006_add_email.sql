-- 0006: contact arrives beside the rename. -- => one expansion per concern
ALTER TABLE customers -- => existing customers keep their names
    ADD COLUMN email TEXT; -- => NULL until the backfill derives it
