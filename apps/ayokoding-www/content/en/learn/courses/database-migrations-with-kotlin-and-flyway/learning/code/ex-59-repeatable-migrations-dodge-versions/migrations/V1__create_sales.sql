-- V1: sales feed the repeatable view.
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    amount INTEGER NOT NULL
);
INSERT INTO sales (amount) VALUES (100), (200);
