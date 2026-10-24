-- V001 creates the partial table the transactionless file below fills halfway.
CREATE TABLE ex72_partial (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL UNIQUE
  -- => UNIQUE is the tripwire the second insert below will hit
);
