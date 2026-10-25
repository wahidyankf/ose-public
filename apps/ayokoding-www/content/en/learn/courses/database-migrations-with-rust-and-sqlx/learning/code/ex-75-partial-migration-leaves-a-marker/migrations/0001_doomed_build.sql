-- no-transaction
-- 0001 doomed: creates, then fails, atomically. -- => the failure under diagnosis
CREATE TABLE leftovers ( -- => atomic with the file despite no-transaction
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => the column the probe will not find
); -- => the definition closes here
SELECT not_a_function(); -- => the failure that voids the whole file
