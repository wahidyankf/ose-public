-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-produce
-- => the table changeset carries one JSONB column for evolving attributes
-- => new attributes arrive as document keys, never as new migrations
CREATE TABLE produce (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL,
  -- => the stable name column queries keep using while attrs evolves
  attrs JSONB NOT NULL
  -- => the flexible document: origins today, grades tomorrow, no DDL
);

-- rollback DROP TABLE produce;
-- => dropping the table reverses the documents and their queries together

-- changeset course:002-seed-produce
-- => the seed changeset stores two documents with nested origins
INSERT INTO produce (name, attrs) VALUES
  ('cengkeh', '{"origin": "Maluku", "grade": "AB"}'),
  ('lada', '{"origin": "Lampung", "grade": "FAQ"}');
-- => single-quoted JSON inside SQL strings: the path query below reads it

-- rollback DELETE FROM produce;
-- => the declared delete un-stores both documents without dropping the table
