-- V1: events start unprocessed.
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    kind TEXT NOT NULL,
    processed BOOLEAN
);
