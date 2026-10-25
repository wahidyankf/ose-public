-- V1: contacts with the legacy phone column.
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL
);
