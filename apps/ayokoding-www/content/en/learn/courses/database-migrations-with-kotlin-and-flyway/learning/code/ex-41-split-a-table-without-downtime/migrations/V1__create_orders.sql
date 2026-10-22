-- V1: one wide table holds everything.
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    item TEXT NOT NULL
);
