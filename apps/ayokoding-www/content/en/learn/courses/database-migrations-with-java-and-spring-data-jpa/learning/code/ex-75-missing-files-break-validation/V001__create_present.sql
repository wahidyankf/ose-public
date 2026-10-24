-- V001 creates the present table: its file ships, its row is honest.
CREATE TABLE ex75_present (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the present name the validation below accounts for
);
