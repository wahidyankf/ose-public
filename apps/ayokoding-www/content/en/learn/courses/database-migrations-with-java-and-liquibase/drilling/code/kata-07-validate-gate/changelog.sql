-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The duplicated id below is the deliberate break the gate must catch.
-- changeset kata:001-make-signals
-- => the first changeset creates the signals table
CREATE TABLE signals (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this kata
  name VARCHAR(60) NOT NULL
  -- => signal names are required from the first migration
);

-- rollback DROP TABLE signals;
-- => this reverse never runs: the gate refuses before any update

-- changeset kata:001-make-signals
-- => DELIBERATE BREAK: the same author and id as the changeset above
-- => two identities collide, so validation must refuse the whole file
CREATE TABLE signal_dup (
  id SERIAL PRIMARY KEY
  -- => this table never exists: the refusal fires before anything runs
);

-- rollback DROP TABLE signal_dup;
-- => this reverse never runs either; nothing in this file ever runs
