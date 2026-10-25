-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-clients
-- => the old table ships first with one seeded row under the old name
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => the seeded name both names below must keep reading
);

INSERT INTO
  clients (name)
VALUES
  ('budi');

-- => one seeded row the rename must carry across to the new table
-- rollback DROP TABLE clients;
-- => dropping the table reverses the seed and the rename together
-- changeset course:002-rename-to-customers
-- => the rename moves the table, then restores the old name as a view
ALTER TABLE clients
RENAME TO customers;

-- => the rename moves rows and constraints; only the name changes
CREATE VIEW clients AS
SELECT
  id,
  name
FROM
  customers;

-- => the compatibility view keeps old queries reading during the move
-- rollback DROP VIEW clients;
-- rollback ALTER TABLE customers RENAME TO clients;
-- => rollback drops the view first, then restores the old table name
-- => formatted SQL runs each rollback line in order, view before table
