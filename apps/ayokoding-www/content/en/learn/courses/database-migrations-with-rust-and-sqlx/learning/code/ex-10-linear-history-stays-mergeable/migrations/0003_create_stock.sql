-- 0003: stock belongs to stores. -- => the third link in the line
CREATE TABLE stock ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    store_id INTEGER NOT NULL REFERENCES stores (id), -- => every stock row sits in a store
    sku TEXT NOT NULL -- => every stock row names a product
); -- => the definition closes here
