-- V001 creates roles and seeds the three the application assumes.
-- Reference data ships with the schema that needs it, in one transaction.
-- A failed seed rolls back the table too: never an empty roles table.
CREATE TABLE ex26_roles (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for roles
  name VARCHAR(50) NOT NULL UNIQUE
  -- => UNIQUE names keep the seed insert safe to reason about
);

-- => the three roles every environment needs from its first query
INSERT INTO
  ex26_roles (name)
VALUES
  ('admin'),
  ('editor'),
  ('viewer');

-- => seeds share the migration transaction with the create above
