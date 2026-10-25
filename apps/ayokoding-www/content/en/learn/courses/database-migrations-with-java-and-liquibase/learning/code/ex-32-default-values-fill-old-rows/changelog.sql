-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-seed-members
-- => the seed changeset creates members with no status column at all
-- => old rows predate the rule the next changeset introduces
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => member names are required from the first migration
);

INSERT INTO
  members (name)
VALUES
  ('budi'),
  ('sari');

-- => two seeded rows that must inherit the default below
-- rollback DROP TABLE members;
-- => dropping the table reverses the seed and the default together
-- changeset course:002-default-status
-- => the default changeset adds the status column defaulting to active
-- => PostgreSQL fills existing rows with the default in the same statement
ALTER TABLE members
ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- rollback ALTER TABLE members DROP COLUMN status;
-- => dropping the column reverses exactly what this changeset added
