-- V001 creates the readable table the shared lock below protects lightly.
CREATE TABLE ex68_readable (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the readable name SELECTs keep fetching under the share lock
);

-- => two rows stand in for live data readers keep querying
INSERT INTO
  ex68_readable (name)
VALUES
  ('one'),
  ('two');

-- => seeds share the migration transaction with the create above
