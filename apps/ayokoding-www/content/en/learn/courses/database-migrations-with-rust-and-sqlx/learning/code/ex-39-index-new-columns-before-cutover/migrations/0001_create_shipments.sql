-- 0001: shipments start unindexed. -- => the query path the index serves
CREATE TABLE shipments ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    tracking TEXT NOT NULL -- => lookups by tracking need the index
); -- => the definition closes here
