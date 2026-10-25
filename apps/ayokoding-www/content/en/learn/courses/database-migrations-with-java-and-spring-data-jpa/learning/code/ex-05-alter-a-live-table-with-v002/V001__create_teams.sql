-- V001 creates teams with one seed row to stand in for live data.
-- Later alters must keep this row valid: the course keeps proving it.
-- Seeding inside the migration makes the example self-contained.
CREATE TABLE ex05_teams (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for teams
  name VARCHAR(100) NOT NULL
  -- => the name ships first, the slug arrives in V002
);

-- => one seed row stands in for the live data alters must preserve
INSERT INTO
  ex05_teams (name)
VALUES
  ('goalkeepers');

-- => the insert shares the migration transaction with the create
