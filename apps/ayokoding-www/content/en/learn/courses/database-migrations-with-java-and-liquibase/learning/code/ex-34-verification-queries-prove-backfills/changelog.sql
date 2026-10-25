-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-seed-circuits
-- => the seed changeset creates circuits with six ungraded rows
CREATE TABLE circuits (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  code VARCHAR(20) NOT NULL,
  -- => codes pair the rows into three natural bands of two
  grade VARCHAR(10)
  -- => grades start NULL; the backfill below derives all six
);

INSERT INTO
  circuits (code)
VALUES
  ('C-1'),
  ('C-2'),
  ('C-3'),
  ('C-4'),
  ('C-5'),
  ('C-6');

-- => six seeded rows awaiting the grades the next changeset assigns
-- rollback DROP TABLE circuits;
-- => dropping the table reverses the seed and the backfill together
-- changeset course:002-grade-circuits
-- => the backfill changeset grades every row from its code band
UPDATE circuits
SET
  grade = CASE
    WHEN code IN ('C-1', 'C-2') THEN 'A'
    WHEN code IN ('C-3', 'C-4') THEN 'B'
    ELSE 'C'
  END;

-- => three bands of two: the verification queries below recount them
-- rollback UPDATE circuits SET grade = NULL;
-- => nulling the grades un-derives every row without dropping the column
