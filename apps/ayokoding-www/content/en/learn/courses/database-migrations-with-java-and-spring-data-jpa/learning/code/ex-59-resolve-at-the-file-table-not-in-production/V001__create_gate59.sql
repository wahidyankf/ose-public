-- V001 creates the gate table the scan below certifies.
CREATE TABLE ex59_gate (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the gate name scanned versions all agree upon
);
