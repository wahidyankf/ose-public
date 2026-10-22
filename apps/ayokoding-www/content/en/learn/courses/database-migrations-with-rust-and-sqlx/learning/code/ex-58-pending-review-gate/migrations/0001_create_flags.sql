-- 0001: flags gate the rollout. -- => applies once, skips on re-runs
CREATE TABLE flags ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every flag must be named
); -- => the definition closes here
