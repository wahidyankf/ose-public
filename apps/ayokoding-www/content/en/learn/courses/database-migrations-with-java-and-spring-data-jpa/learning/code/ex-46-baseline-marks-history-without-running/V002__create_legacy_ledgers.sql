-- V002 describes the ledgers table legacy databases already have.
-- Baselined alongside V001: assumed present, never replayed.
CREATE TABLE ex46_ledgers_placeholder (id SERIAL PRIMARY KEY);

-- => placeholder keeps the file honest about the version it represents
