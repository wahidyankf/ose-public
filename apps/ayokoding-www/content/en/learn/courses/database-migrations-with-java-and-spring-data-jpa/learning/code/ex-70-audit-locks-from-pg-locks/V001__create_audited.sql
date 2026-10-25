-- V001 creates the audited table the lock audit below watches.
CREATE TABLE ex70_audited (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the audited name the locked migration extends
);

-- => one row stands in for live data under the audited lock
INSERT INTO
  ex70_audited (name)
VALUES
  ('keeper');

-- => seeds share the migration transaction with the create above
