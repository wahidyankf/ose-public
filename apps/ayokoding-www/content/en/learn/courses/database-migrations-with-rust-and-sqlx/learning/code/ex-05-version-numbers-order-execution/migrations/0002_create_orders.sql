-- 0002: orders reference customers. -- => second by number, runs in the middle
CREATE TABLE orders ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    customer_id INTEGER NOT NULL REFERENCES customers (id) -- => every order belongs to a customer
); -- => the definition closes here
