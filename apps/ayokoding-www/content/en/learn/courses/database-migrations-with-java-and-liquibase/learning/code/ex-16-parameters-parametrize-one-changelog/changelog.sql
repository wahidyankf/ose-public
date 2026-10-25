-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-regs
-- => the schema qualifier is a parameter, so this file serves any schema
-- => the program sets ${schema} to public before running
CREATE TABLE ${schema}.regs (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  code VARCHAR(20) NOT NULL
  -- => registration codes are required from the first migration
);

-- rollback DROP TABLE ${schema}.regs;
-- => parameters substitute in rollback blocks exactly as in changes
