-- V3: the new table backfills from the old.
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    item TEXT NOT NULL
);
INSERT INTO order_items (order_id, item) SELECT id, item FROM orders;
