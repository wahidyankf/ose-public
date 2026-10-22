-- 0001: ledgers anchor guarded work. -- => the first version the lock guards
CREATE TABLE ledgers ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every ledger must be named
); -- => the definition closes here
