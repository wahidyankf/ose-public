-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-atolls
-- => the audited changeset creates the atolls table the audit below names
CREATE TABLE atolls (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => atoll names are required from the first migration
);

-- rollback DROP TABLE atolls;
-- => dropping the table reverses the audited change with its audit intact
-- changeset course:002-make-audit
-- => the audit changeset creates the audit table beside the audited one
CREATE TABLE migration_audit (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  actor VARCHAR(60) NOT NULL,
  -- => the actor column names the migrator reviewers can ask
  action VARCHAR(120) NOT NULL
  -- => the action column records the migration in application terms
);

-- rollback DROP TABLE migration_audit;
-- => the audit table rolls back with the change it witnessed, honestly
