-- 0001: inventory starts with sku only. -- => quantity arrives in a later file
CREATE TABLE inventory ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    sku TEXT NOT NULL -- => the stock-keeping unit every row carries
); -- => the definition closes here
