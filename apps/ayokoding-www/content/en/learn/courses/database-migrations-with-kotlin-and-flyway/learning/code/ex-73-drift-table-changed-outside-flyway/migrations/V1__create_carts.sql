-- V1: carts the way migrations describe them.
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    owner TEXT NOT NULL
);
