-- 0001: docks are the good version. -- => applies once, skips on re-runs
CREATE TABLE docks ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    label TEXT NOT NULL -- => every dock must be labeled
); -- => the definition closes here
