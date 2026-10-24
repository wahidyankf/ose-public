-- V2: WRONGTYPE fails and will be repaired away.
CREATE TABLE broken (
    id WRONGTYPE PRIMARY KEY
);
