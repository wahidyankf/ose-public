-- V1: inventory starts with two seeded rows.
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    item TEXT NOT NULL
);
INSERT INTO inventory (item) VALUES ('nails'), ('bolts');
