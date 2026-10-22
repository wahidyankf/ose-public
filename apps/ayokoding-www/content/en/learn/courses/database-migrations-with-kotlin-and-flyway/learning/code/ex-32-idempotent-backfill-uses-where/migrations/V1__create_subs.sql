-- V1: subscriptions without tiers.
CREATE TABLE subs (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    tier TEXT
);
