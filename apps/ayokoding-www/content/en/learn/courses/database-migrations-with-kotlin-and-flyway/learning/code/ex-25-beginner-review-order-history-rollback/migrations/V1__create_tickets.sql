-- V1: tickets start with a title.
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL
);
