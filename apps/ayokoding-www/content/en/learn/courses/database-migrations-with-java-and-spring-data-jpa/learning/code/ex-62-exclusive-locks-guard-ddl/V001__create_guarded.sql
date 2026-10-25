-- V001 creates the guarded table the locked migration below alters.
CREATE TABLE ex62_guarded (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the guarded name the exclusive lock protects during the alter
);

-- => one row stands in for live data locked out during DDL
INSERT INTO
  ex62_guarded (name)
VALUES
  ('keeper');

-- => seeds share the migration transaction with the create above
