-- 0001: customers open the shop. -- => the table every later file builds on
CREATE TABLE customers ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => the legacy name the rename later retires
); -- => the definition closes here
