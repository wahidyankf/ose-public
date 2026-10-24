-- V1: parcels without statuses.
CREATE TABLE parcels (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL,
    status TEXT
);
