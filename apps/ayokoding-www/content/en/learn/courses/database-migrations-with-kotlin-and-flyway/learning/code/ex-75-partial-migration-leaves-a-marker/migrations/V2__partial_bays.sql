-- V2: the first statement succeeds, the second explodes.
CREATE TABLE staged_bays (
    id SERIAL PRIMARY KEY
);
CREATE TABLE doomed_bays (
    id WRONGTYPE PRIMARY KEY
);
