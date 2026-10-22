-- 0001: products declare the shape only. -- => no rows here, only structure
CREATE TABLE products ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    sku TEXT NOT NULL UNIQUE, -- => every product owns a unique sku
    price INTEGER NOT NULL -- => prices store as integer minor units
); -- => the definition closes here
