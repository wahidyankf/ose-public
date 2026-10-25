-- 0001 team B: squads collide on version 1. -- => same number, different table
CREATE TABLE squads ( -- => the colliding claim
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every squad must be named
); -- => the definition closes here
