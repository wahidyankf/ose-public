-- V1: the first schema change; one file, one table.
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL
);
