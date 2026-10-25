-- 0001: teams stand alone. -- => one file, one table, one decision
CREATE TABLE teams ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every team must be named
); -- => the definition closes here
