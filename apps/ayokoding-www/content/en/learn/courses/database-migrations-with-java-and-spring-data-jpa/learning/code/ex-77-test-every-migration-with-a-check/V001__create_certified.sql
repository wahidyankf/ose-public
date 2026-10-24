-- V001 creates the certified table its own check below proves.
CREATE TABLE ex77_certified (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the certified name the inline check counts
);

-- => two rows give the check something to certify
INSERT INTO
  ex77_certified (name)
VALUES
  ('one'),
  ('two');

-- => seeds share the migration transaction with the create above
