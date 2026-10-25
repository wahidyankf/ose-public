-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Release 1 creates the customers table with two seeded customers.
-- changeset course:001-create-customers
-- => customers anchor every order the later releases build
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this release
  name VARCHAR(60) NOT NULL
  -- => the old name the rename releases below will retire in stages
);
INSERT INTO customers (name) VALUES ('budi'), ('sari');
-- => two seeded customers the backfill and rename below carry forward

-- rollback DROP TABLE customers;
-- => this reverse never runs here; the capstone ships forward only
