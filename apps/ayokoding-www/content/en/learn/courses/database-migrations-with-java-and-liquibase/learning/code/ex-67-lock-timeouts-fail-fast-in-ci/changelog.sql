-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-theta
-- => the seed changeset creates the theta table, applied before any lock
CREATE TABLE theta (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => the seeded table the timed-out attempt leaves exactly as found
);

-- rollback DROP TABLE theta;
-- => this reverse never runs: the contender never reaches past the lock

-- changeset course:002-make-iota
-- => the pending changeset creates the iota table the contender wants
-- => pending work forces lock acquisition; nothing pending would skip it
CREATE TABLE iota (
  id SERIAL PRIMARY KEY,
  -- => iotas get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => the table that never exists because the lock never arrives
);

-- rollback DROP TABLE iota;
-- => this reverse never runs: the forward move never reached the table
