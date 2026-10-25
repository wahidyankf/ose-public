-- 0002: orders reference customers. -- => the managed chain grows normally
CREATE TABLE orders ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    customer_id INTEGER NOT NULL REFERENCES customers (id), -- => every order belongs to a customer
    total INTEGER NOT NULL -- => totals store as integer minor units
); -- => the definition closes here
