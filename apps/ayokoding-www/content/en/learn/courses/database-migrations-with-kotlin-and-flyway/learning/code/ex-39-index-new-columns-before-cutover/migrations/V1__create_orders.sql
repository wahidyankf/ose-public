-- V1: orders keyed by the legacy code.
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL
);
