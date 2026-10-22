-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-canonical-reports
-- => the canonical changeset both databases share before any drift
-- => identical history on both sides isolates the hotfix as the only diff
CREATE TABLE harbour_reports (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  title VARCHAR(80) NOT NULL
  -- => report titles are required from the first migration
);

-- rollback DROP TABLE harbour_reports;
-- => this reverse never runs here; the example reconciles, never rolls back
