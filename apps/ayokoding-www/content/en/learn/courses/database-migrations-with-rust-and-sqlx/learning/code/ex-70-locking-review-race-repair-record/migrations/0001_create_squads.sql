-- 0001: squads anchor the review. -- => the first version the racers share
CREATE TABLE squads ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every squad must be named
); -- => the definition closes here
