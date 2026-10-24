-- V1: devices without serials.
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    model TEXT NOT NULL
);
