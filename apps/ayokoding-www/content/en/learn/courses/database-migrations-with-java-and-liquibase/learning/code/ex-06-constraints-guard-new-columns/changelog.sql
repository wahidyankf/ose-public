-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- changeset course:001-create-accounts
-- => handles start nullable: constraints arrive as their own changesets
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  handle VARCHAR(50)
  -- => deliberately born nullable so the next changeset has work to do
);

-- rollback DROP TABLE accounts;
-- => dropping the table reverses exactly what this changeset built
-- changeset course:002-require-handle
-- => NULL handles are a data bug: the schema should refuse them outright
ALTER TABLE accounts
ALTER COLUMN handle
SET
  NOT NULL;

-- => SET NOT NULL fails on a table that already holds NULLs, by design
-- rollback ALTER TABLE accounts ALTER COLUMN handle DROP NOT NULL;
-- => nullability reverses symmetrically when the rule is rolled back
-- changeset course:003-unique-handle
-- => duplicate handles would merge two users: uniqueness is identity here
ALTER TABLE accounts ADD CONSTRAINT uq_accounts_handle UNIQUE (handle);

-- => a named constraint produces error messages a human can act on
-- rollback ALTER TABLE accounts DROP CONSTRAINT uq_accounts_handle;
-- => named constraints drop by name, so naming them is load-bearing
