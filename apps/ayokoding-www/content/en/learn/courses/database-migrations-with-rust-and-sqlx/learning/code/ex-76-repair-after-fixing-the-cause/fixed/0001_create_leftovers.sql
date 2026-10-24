-- 0001 fixed: the table, without the doom. -- => corrected content, still version 1
CREATE TABLE leftovers ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => the table the repair adopts
); -- => the definition closes here
