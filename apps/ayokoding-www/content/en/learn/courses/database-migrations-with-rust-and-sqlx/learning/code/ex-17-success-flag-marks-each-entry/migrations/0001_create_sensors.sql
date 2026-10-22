-- 0001: sensors stream the readings. -- => the first healthy row
CREATE TABLE sensors ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every sensor must be named
); -- => the definition closes here
