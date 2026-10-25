-- V2: WRONGTYPE fails; repair clears the failure state.
CREATE TABLE broken (
    id WRONGTYPE PRIMARY KEY
);
