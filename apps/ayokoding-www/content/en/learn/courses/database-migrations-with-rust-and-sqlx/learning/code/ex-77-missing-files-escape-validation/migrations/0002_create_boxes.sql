-- 0002: boxes sit on shelves. -- => the version the slim binary lacks
CREATE TABLE boxes ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    shelf_id INTEGER NOT NULL REFERENCES shelves (id), -- => every box sits on a shelf
    label TEXT NOT NULL -- => every box must be labeled
); -- => the definition closes here
