-- V1: the lookup table with a natural key.
CREATE TABLE order_status (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL
);
