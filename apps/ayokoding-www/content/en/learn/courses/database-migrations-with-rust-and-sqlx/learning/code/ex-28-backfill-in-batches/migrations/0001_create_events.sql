-- 0001: events start without days. -- => the shape before batching
CREATE TABLE events ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL, -- => every event must be named
    day TEXT -- => NULL until a batch claims the row
); -- => the definition closes here
