-- V1: customers with the legacy email column.
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL
);
