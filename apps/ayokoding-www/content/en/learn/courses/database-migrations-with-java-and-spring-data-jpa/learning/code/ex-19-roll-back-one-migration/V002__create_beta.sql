-- V002 creates beta: the middle layer that survives this rollback.
CREATE TABLE ex19_beta (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the beta name the tip layer references
);
