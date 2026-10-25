-- V2: WRONGTYPE fails and must release the lock.
CREATE TABLE broken (
    id WRONGTYPE PRIMARY KEY
);
