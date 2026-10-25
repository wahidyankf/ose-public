-- V001 creates the diagnosed table the three failures below probe.
CREATE TABLE ex76_diagnosed (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL UNIQUE
  -- => UNIQUE and NOT NULL are the tripwires the probes below will hit
);

-- => one row gives the unique probe something to collide with
INSERT INTO
  ex76_diagnosed (name)
VALUES
  ('taken');

-- => seeds share the migration transaction with the create above
