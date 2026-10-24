-- 0003: items belong to orders. -- => third by number, runs last
CREATE TABLE items ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    order_id INTEGER NOT NULL REFERENCES orders (id) -- => every item belongs to an order
); -- => the definition closes here
