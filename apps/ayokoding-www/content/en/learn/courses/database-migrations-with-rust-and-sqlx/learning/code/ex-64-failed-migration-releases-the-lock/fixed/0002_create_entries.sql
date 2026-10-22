-- 0002 fixed: entries reference ledgers. -- => corrected content, same free number
CREATE TABLE entries ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    ledger_id INTEGER NOT NULL REFERENCES ledgers (id), -- => every entry posts to a ledger
    amount INTEGER NOT NULL -- => amounts store as integer minor units
); -- => the definition closes here
