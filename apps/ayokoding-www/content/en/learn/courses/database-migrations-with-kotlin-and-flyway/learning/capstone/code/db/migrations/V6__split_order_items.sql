-- V6: line items split out of orders with a quantity backfill.
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    item TEXT NOT NULL,
    qty INTEGER NOT NULL
);
INSERT INTO order_items (order_id, item, qty) SELECT id, item, 1 FROM orders;
