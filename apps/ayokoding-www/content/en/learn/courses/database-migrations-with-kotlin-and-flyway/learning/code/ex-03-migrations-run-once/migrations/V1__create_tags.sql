-- V1: a tiny lookup table for the idempotency demo.
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    label TEXT NOT NULL
);
