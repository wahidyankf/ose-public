-- V2: the first statement succeeds, the second explodes.
CREATE TABLE staged_rooms (
    id SERIAL PRIMARY KEY
);
CREATE TABLE doomed (
    id WRONGTYPE PRIMARY KEY
);
