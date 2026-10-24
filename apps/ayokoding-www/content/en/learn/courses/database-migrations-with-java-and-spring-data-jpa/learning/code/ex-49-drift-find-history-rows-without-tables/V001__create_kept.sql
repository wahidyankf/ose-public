-- V001 creates the table that survives the drift experiment below.
CREATE TABLE ex49_kept (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the kept name the reverse scan still finds
);
