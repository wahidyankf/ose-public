-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The 003 prefix makes this file audit third under includeAll.
-- changeset course:003-make-chi
-- => the third audited changeset creates the chi table
CREATE TABLE chi (
  id SERIAL PRIMARY KEY,
  -- => chis get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => chi names are required from the first migration
);

-- rollback DROP TABLE chi;
-- => this reverse never runs here; audits list, they do not roll back
