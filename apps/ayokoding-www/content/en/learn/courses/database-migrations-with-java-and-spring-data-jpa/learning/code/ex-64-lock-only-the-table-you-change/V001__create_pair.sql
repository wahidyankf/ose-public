-- V001 creates the changed table and its untouched neighbor side by side.
CREATE TABLE ex64_changed (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the changed name the locked migration below alters
);

-- => the neighbor shares the schema but never the lock below
CREATE TABLE ex64_neighbor (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the neighbor name the verification proves stayed unlocked
);
