-- 0001: ateliers anchor the finale. -- => the first version under final review
CREATE TABLE ateliers ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every atelier must be named
); -- => the definition closes here
