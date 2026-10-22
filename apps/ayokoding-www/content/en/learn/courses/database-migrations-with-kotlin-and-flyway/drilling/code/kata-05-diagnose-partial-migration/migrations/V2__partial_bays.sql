-- V2: the second statement fails; diagnose what remains.
CREATE TABLE staged_bays (
    id SERIAL PRIMARY KEY
);
CREATE TABLE doomed_bays (
    id WRONGTYPE PRIMARY KEY
);
