-- 0002 team B renumbered: squads merge cleanly. -- => the next free number
CREATE TABLE squads ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every squad must be named
); -- => the definition closes here
