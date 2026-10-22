-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The 002 prefix makes this file audit second under includeAll.
-- changeset course:002-make-phi
-- => the second audited changeset creates the phi table
CREATE TABLE phi (
  id SERIAL PRIMARY KEY,
  -- => phis get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => phi names are required from the first migration
);

-- rollback DROP TABLE phi;
-- => this reverse never runs here; audits list, they do not roll back
