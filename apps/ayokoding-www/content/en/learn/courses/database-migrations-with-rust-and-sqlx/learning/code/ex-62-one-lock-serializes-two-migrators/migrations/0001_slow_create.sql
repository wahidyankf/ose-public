-- 0001: slow enough to race. -- => the sleep makes the overlap real
SELECT pg_sleep(1); -- => one slow second under the advisory lock
CREATE TABLE racers ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every racer must be named
); -- => the definition closes here
