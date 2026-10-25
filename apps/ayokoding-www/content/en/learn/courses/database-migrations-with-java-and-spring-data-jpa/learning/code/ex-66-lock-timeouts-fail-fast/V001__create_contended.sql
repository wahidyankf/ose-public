-- V001 creates the contended table the timeout experiment below guards.
CREATE TABLE ex66_contended (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the contended name two connections will fight over politely
);

-- => one row stands in for live data behind the contested lock
INSERT INTO
  ex66_contended (name)
VALUES
  ('keeper');

-- => seeds share the migration transaction with the create above
