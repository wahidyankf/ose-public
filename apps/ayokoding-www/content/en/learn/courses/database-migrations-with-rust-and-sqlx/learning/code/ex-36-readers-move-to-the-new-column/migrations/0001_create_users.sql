-- 0001: users start with one name. -- => the old column readers keep
CREATE TABLE users ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => the old column, source of the copy
); -- => the definition closes here
