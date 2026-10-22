-- 0001 up: shelves arrive with a label. -- => the forward half of the pair
CREATE TABLE shelves ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    label TEXT NOT NULL -- => every shelf must be labeled
); -- => the definition closes here
