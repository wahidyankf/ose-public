-- V1: accounts start with a balance.
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    balance INTEGER NOT NULL
);
