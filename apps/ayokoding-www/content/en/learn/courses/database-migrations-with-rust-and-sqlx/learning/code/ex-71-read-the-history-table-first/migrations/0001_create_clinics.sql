-- 0001: clinics anchor care work. -- => the first fact in the dump
CREATE TABLE clinics ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every clinic must be named
); -- => the definition closes here
