-- V2: pending work the release branch adds.
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    court_id INTEGER NOT NULL REFERENCES courts(id)
);
