-- V2: visits belong to a clinic.
CREATE TABLE visits (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL REFERENCES clinics(id),
    day TEXT NOT NULL
);
