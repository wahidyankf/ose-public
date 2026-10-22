-- 0002: growth is a new file, never an edit to 0001. -- => append-only history keeps reviews honest
ALTER TABLE authors -- => the existing table keeps every row it already holds
    ADD COLUMN email TEXT; -- => nullable first: old rows need no backfill yet
