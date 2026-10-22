-- V2: WRONGTYPE fails and flags the row.
CREATE TABLE broken (
    id WRONGTYPE PRIMARY KEY
);
