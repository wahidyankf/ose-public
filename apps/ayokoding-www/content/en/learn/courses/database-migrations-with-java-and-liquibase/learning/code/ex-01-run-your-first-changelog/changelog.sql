-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-create-users
-- => author "course" plus id "001-create-users" is this changeset's identity
-- => Liquibase stores (author, id, filename) in DATABASECHANGELOG on success
-- => Running it again later is a NO-OP because that row already exists
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  username VARCHAR(50) NOT NULL
  -- => NOT NULL at creation time keeps the first migration honest
);

-- => Liquibase runs this DDL inside one transaction on PostgreSQL
-- rollback DROP TABLE users;
-- => every changeset that can be undone declares its reverse here
-- => Example 18 runs this line; until then it is a promise, not an action
