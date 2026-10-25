-- 0001: teams anchor the merge. -- => applies once, skips on re-runs
CREATE TABLE teams ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every team must be named
); -- => the definition closes here
