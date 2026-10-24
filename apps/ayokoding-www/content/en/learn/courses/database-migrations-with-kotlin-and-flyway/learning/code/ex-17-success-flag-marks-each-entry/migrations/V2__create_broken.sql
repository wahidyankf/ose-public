-- V2: WRONGTYPE does not exist, so this migration fails.
CREATE TABLE broken (
    id WRONGTYPE PRIMARY KEY
);
