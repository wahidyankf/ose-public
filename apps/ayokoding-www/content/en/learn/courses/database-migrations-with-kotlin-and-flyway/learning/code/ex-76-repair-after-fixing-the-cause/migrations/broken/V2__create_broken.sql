-- V2: WRONGTYPE fails and starts the runbook.
CREATE TABLE broken (
    id WRONGTYPE PRIMARY KEY
);
