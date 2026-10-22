-- 0001: authors start with an id and a name. -- => the create every later file builds on
CREATE TABLE authors ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every author must be named
); -- => the definition closes here
