-- 0001: the version the lock guards. -- => ordinary work under the advisory lock
CREATE TABLE locks ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every lock row must be named
); -- => the definition closes here
