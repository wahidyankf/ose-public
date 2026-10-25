-- V2: magazines reference their publisher.
CREATE TABLE magazines (
    id SERIAL PRIMARY KEY,
    publisher_id INTEGER NOT NULL REFERENCES publishers(id),
    title TEXT NOT NULL
);
