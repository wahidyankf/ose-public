-- 0001: customers anchor the shop schema. -- => intent lives in the file name
CREATE TABLE customers ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every customer must be named
); -- => the definition closes here
