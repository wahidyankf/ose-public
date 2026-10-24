-- 0001: customers start with one name. -- => the rename subject
CREATE TABLE customers ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => the old column the contraction removes
); -- => the definition closes here
