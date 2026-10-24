-- V1: riders without tiers.
CREATE TABLE riders (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    tier TEXT
);
