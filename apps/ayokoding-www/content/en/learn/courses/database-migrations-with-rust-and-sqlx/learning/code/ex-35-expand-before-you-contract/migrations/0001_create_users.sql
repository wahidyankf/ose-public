-- 0001: users start with one name. -- => the shape old code reads
CREATE TABLE users ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => the old column, untouched by the expansion
); -- => the definition closes here
