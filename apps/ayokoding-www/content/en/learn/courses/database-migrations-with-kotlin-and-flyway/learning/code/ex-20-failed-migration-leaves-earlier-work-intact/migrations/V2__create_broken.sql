-- V2: WRONGTYPE fails, but V1 stays committed.
CREATE TABLE broken (
    id WRONGTYPE PRIMARY KEY
);
