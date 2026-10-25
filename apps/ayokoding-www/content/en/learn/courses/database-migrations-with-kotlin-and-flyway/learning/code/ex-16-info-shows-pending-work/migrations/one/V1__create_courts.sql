-- V1: the only migration the database knows.
CREATE TABLE courts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);
