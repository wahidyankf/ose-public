-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-goods
-- => the table changeset creates goods with the old two-column shape
CREATE TABLE goods (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => the old shape every blue-deploy query still names
);
INSERT INTO goods (name) VALUES ('kopi');
-- => one seeded row both deploys must keep reading through the switch

-- rollback DROP TABLE goods;
-- => dropping the table reverses the seed and the addition together

-- changeset course:002-add-tag
-- => the compatible change adds a nullable column and nothing else
-- => nullable means old inserts without the column keep working untouched
ALTER TABLE goods ADD COLUMN tag VARCHAR(30);

-- rollback ALTER TABLE goods DROP COLUMN tag;
-- => dropping the column un-adds without touching the old shape
