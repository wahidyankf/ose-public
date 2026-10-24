-- V1: orders without totals.
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    item TEXT NOT NULL,
    total INTEGER
);
