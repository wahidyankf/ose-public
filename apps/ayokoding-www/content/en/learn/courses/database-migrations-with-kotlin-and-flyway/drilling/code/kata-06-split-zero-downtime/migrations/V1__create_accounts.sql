-- V1: accounts with the legacy name column.
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);
