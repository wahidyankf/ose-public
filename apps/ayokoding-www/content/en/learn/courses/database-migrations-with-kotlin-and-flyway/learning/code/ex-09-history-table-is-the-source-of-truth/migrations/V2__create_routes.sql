-- V2: routes connect two depots.
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    from_id INTEGER NOT NULL REFERENCES depots(id),
    to_id INTEGER NOT NULL REFERENCES depots(id)
);
