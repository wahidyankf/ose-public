-- V001 creates the table the elected migrator below will extend.
CREATE TABLE ex63_elected (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the elected name serialized migrations protect
);
