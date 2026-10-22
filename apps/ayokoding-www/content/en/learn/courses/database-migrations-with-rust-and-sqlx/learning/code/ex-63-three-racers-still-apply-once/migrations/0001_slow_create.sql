-- 0001: slow enough for a crowd. -- => the sleep makes the overlap real
SELECT pg_sleep(1); -- => one slow second under the advisory lock
CREATE TABLE crowds ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every crowd member must be named
); -- => the definition closes here
