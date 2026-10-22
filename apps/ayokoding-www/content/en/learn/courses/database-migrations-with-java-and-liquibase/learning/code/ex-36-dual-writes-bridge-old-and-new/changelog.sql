-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-notices
-- => the expand changeset creates notices with old and new columns together
-- => the seed fills only the old column; the program bridges the new one
CREATE TABLE notices (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  title VARCHAR(120) NOT NULL,
  -- => the old column old readers still consume
  body TEXT
  -- => the new column, born nullable until dual writes fill it
);

-- rollback DROP TABLE notices;
-- => dropping the table reverses the expand and the bridge together
