-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- changeset course:001-create-players
-- => the table exists first; later changesets extend it in place
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  handle VARCHAR(50) NOT NULL
  -- => the only column the table starts life with
);

-- rollback DROP TABLE players;
-- => dropping the table reverses exactly what this changeset built

-- changeset course:002-add-level
-- => a second changeset alters the live table instead of recreating it
-- => existing rows keep their data; the new column starts NULL everywhere
ALTER TABLE players ADD COLUMN level INTEGER;
-- => plain SQL inside a tracked changeset: the best of both formats

-- rollback ALTER TABLE players DROP COLUMN level;
-- => additive changes reverse by dropping what was added
