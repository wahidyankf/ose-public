-- V1 edited after the fact: an extra column breaks the promise.
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    sneaky TEXT
);
