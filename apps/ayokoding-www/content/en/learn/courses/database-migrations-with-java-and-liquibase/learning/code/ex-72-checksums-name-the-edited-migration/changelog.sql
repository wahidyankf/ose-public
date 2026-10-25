-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-nu
-- => the first honest changeset creates the nu table
-- => its checksum stays honest, framing the edited middle below
CREATE TABLE nu (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => nu names are required from the first migration
);

-- rollback DROP TABLE nu;
-- => dropping the table reverses exactly what this changeset built
-- changeset course:002-make-xi
-- => the middle changeset creates the xi table
-- => the program tampers this row's checksum to stand in for an edit
CREATE TABLE xi (
  id SERIAL PRIMARY KEY,
  -- => xis get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => xi names are required from the first migration
);

-- rollback DROP TABLE xi;
-- => each changeset carries its own reverse, independent of its neighbours
-- changeset course:003-make-omicron
-- => the last honest changeset creates the omicron table
-- => its checksum stays honest, framing the edited middle above
CREATE TABLE omicron (
  id SERIAL PRIMARY KEY,
  -- => omicrons get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => omicron names are required from the first migration
);

-- rollback DROP TABLE omicron;
-- => the last honest step reverses first when the release rolls back
