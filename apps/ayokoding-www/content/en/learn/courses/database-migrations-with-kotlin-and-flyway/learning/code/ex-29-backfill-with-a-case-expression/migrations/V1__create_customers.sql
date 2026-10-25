-- V1: customers with lifetime totals.
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    lifetime_total INTEGER NOT NULL
);
