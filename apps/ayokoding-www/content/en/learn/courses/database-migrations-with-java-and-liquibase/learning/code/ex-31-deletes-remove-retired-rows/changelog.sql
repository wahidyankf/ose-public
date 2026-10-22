-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-seed-scopes
-- => the seed changeset creates the table with two analog and two digital rows
CREATE TABLE scopes (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  model VARCHAR(40) NOT NULL,
  -- => model names identify each row for the retirement below
  kind VARCHAR(20) NOT NULL
  -- => the kind column is what the retirement changeset filters on
);
INSERT INTO scopes (model, kind) VALUES ('OA-101', 'analog'), ('OA-102', 'analog'), ('OD-201', 'digital'), ('OD-202', 'digital');
-- => four seeded rows: the analog pair is already scheduled for retirement

-- rollback DROP TABLE scopes;
-- => dropping the table reverses the seed and the retirement together

-- changeset course:002-retire-analog
-- => the retirement changeset deletes exactly the analog rows
-- => a narrow WHERE keeps the digital rows untouched and reviewable
DELETE FROM scopes WHERE kind = 'analog';

-- rollback INSERT INTO scopes (model, kind) VALUES ('OA-101', 'analog'), ('OA-102', 'analog');
-- => the reverse re-inserts the retired rows by their known values
-- => ids differ after restore, so rows are addressed by model, never by id
