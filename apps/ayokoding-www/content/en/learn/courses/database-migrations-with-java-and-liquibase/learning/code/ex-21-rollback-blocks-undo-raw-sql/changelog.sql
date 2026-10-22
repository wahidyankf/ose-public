-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-sheds
-- => one raw SQL changeset: hand-written DDL with a hand-written reverse
-- => Liquibase cannot infer the undo; the block below declares it
CREATE TABLE sheds (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => shed names are required from the first migration
);

-- rollback DROP TABLE sheds;
-- => the declared block is the only reverse raw SQL changesets get
-- => Example 18 ran this line; here it carries the whole lesson instead
