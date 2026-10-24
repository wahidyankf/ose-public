-- V001 creates the repairable table the partial and repair share.
CREATE TABLE ex73_repairable (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL UNIQUE
  -- => UNIQUE tripped the original partial, the repair respects it
);

-- => one row stands in for the partial footprint V002 would leave
INSERT INTO
  ex73_repairable (name)
VALUES
  ('keeper');

-- => the kept row is what the repair finds and builds upon
