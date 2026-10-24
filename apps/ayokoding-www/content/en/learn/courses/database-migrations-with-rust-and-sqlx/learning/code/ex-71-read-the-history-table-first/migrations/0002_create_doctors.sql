-- 0002: doctors practice at clinics. -- => the second fact in the dump
CREATE TABLE doctors ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    clinic_id INTEGER NOT NULL REFERENCES clinics (id), -- => every doctor practices somewhere
    name TEXT NOT NULL -- => every doctor must be named
); -- => the definition closes here
