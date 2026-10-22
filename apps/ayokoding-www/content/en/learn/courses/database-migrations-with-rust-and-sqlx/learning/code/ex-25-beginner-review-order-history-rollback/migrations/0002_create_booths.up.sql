-- 0002 up: booths join the market. -- => the version the review reverts
CREATE TABLE booths ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    stall_id INTEGER NOT NULL REFERENCES stalls (id), -- => every booth belongs to a stall
    name TEXT NOT NULL -- => every booth must be named
); -- => the definition closes here
