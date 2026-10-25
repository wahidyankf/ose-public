-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-yard
-- => the table changeset ships first without the index it needed
-- => editing it now would break every database that already ran it
CREATE TABLE yard (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  code VARCHAR(20) NOT NULL
  -- => the code column the appended fix below will index
);

-- rollback DROP TABLE yard;
-- => dropping the table reverses the table and the appended fix together
-- changeset course:002-add-yard-index
-- => the fix arrives appended, never inserted: history stays append-only
-- => a new changeset runs everywhere; an edit would fail checksums
CREATE INDEX ix_yard_code ON yard (code);

-- => the late-arriving index lands last in history, exactly where it ran
-- rollback DROP INDEX ix_yard_code;
-- => dropping the index un-appends the fix without touching the table
