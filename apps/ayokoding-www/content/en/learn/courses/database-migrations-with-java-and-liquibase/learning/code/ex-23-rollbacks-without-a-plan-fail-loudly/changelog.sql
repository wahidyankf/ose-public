-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-crates
-- => the table changeset carries its reverse, so it is not the problem
CREATE TABLE crates (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  code VARCHAR(20) NOT NULL
  -- => crate codes are required from the first migration
);

-- rollback DROP TABLE crates;
-- => this reverse exists but never runs: the failure below fires first

-- changeset course:002-seal-crates
-- => raw SQL with deliberately no rollback block and no inferable reverse
-- => ADD COLUMN on raw SQL cannot be reversed automatically, by design
ALTER TABLE crates ADD COLUMN seal VARCHAR(20);
-- => the missing reverse is the whole lesson: rolling this back must fail
-- => a data-preserving reverse would need a compensating changeset instead
