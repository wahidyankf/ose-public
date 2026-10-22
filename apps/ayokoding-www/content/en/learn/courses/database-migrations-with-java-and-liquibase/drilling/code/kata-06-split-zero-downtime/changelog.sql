-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The expand changeset creates both columns together for the bridge.
-- changeset kata:001-make-circulars
-- => old and new start side by side; the kata bridges them by hand
CREATE TABLE circulars (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this kata
  title VARCHAR(120) NOT NULL,
  -- => the old column old readers still consume
  body TEXT
  -- => the new column, born nullable until dual writes fill it
);

-- rollback DROP TABLE circulars;
-- => this reverse never runs here; the kata bridges forward only
