-- V2: goods belong to a stall.
CREATE TABLE goods (
    id SERIAL PRIMARY KEY,
    stall_id INTEGER NOT NULL REFERENCES stalls(id),
    name TEXT NOT NULL
);
