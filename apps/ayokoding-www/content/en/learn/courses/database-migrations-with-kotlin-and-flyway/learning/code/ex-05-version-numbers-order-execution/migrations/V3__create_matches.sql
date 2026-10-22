-- V3: matches reference two teams.
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    home_id INTEGER NOT NULL REFERENCES teams(id),
    away_id INTEGER NOT NULL REFERENCES teams(id)
);
