-- V2 healed: the ferry the team meant to build.
CREATE TABLE ferries (
    id SERIAL PRIMARY KEY,
    pier_id INTEGER NOT NULL REFERENCES piers(id)
);
