-- 0001 up: members start plain. -- => the baseline the rollback returns to
CREATE TABLE members ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every member must be named
); -- => the definition closes here
