-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-teas
-- => the table changeset creates teas with the new origin column included
CREATE TABLE teas (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL,
  -- => the old column every v1 reader still names
  origin VARCHAR(60)
  -- => the new column only v2 readers may name
);

INSERT INTO
  teas (name, origin)
VALUES
  ('teh melati', 'Maluku');

-- => one seeded row both view versions below must keep reading
-- rollback DROP TABLE teas;
-- => dropping the table reverses the rows and both versions together
-- changeset course:002-version-views
-- => the version changeset freezes one read shape per reader generation
CREATE VIEW teas_v1 AS
SELECT
  id,
  name
FROM
  teas;

-- => v1 hides the new column: old readers never see a shape they lack
CREATE VIEW teas_v2 AS
SELECT
  id,
  name,
  origin
FROM
  teas;

-- => v2 exposes the new column: migrated readers move here at leisure
-- rollback DROP VIEW teas_v2;
-- rollback DROP VIEW teas_v1;
-- => dropping the new version first restores the single-shape past
