-- 0001 up: camps arrive with a name. -- => the forward half of the pair
CREATE TABLE camps ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every camp must be named
); -- => the definition closes here
