-- 0001: wards are the good version. -- => survives the version 2 failure
CREATE TABLE wards ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every ward must be named
); -- => the definition closes here
