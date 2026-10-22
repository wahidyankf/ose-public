-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The builder sorts second, after the duplicate it replaces.
-- changeset course:002-a-cargo
-- => the builder creates the cargo table the duplicate guarded on
CREATE TABLE cargo (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  code VARCHAR(20) NOT NULL
  -- => the code column the stood-down duplicate would have indexed
);

-- rollback DROP TABLE cargo;
-- => dropping the table reverses the builder after the duplicate stood down
