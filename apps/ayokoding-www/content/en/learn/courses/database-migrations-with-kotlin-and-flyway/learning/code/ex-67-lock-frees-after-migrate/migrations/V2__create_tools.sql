-- V2: tools belong to a shed.
CREATE TABLE tools (
    id SERIAL PRIMARY KEY,
    shed_id INTEGER NOT NULL REFERENCES sheds(id),
    name TEXT NOT NULL
);
