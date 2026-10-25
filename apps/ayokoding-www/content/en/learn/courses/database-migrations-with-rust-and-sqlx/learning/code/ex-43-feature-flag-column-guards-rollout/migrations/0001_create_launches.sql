-- 0001: launches start flagless. -- => the flag arrives before any rollout
CREATE TABLE launches ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every launch must be named
); -- => the definition closes here
