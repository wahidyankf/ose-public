-- V2: the file someone will delete.
CREATE TABLE grain (
    id SERIAL PRIMARY KEY,
    silo_id INTEGER NOT NULL REFERENCES silos(id)
);
