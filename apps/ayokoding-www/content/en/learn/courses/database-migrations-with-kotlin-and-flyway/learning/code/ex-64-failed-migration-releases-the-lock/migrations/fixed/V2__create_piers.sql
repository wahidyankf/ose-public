-- V2 fixed: the pier the race meant to build.
CREATE TABLE piers (
    id SERIAL PRIMARY KEY,
    dock_id INTEGER NOT NULL REFERENCES docks(id)
);
