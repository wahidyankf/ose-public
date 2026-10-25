-- V2: orders reference customers; two customers and three orders seed the shop.
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    item TEXT NOT NULL
);
INSERT INTO customers (name) VALUES ('sari'), ('budi');
INSERT INTO orders (customer_id, item) VALUES (1, 'rice'), (1, 'oil'), (2, 'rice');
