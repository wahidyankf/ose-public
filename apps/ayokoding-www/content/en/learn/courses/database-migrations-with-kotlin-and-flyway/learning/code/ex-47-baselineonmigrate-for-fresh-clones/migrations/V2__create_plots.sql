-- V2: plots belong to a garden.
CREATE TABLE plots (
    id SERIAL PRIMARY KEY,
    garden_id INTEGER NOT NULL REFERENCES gardens(id)
);
