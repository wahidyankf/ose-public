-- 0002: stores belong to regions. -- => the second link in the line
CREATE TABLE stores ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    region_id INTEGER NOT NULL REFERENCES regions (id), -- => every store sits in a region
    name TEXT NOT NULL -- => every store must be named
); -- => the definition closes here
