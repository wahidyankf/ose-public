-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- changeset shop:001-create-customers
-- => author "shop" (team or project name, not a personal name)
-- => id "001-create-customers" (sequence plus short description)
-- => (shop, 001-create-customers, changelog.sql) is the stored identity
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  email VARCHAR(255) NOT NULL
  -- => customers are keyed by email in this small shop schema
);

-- rollback DROP TABLE customers;
-- => dropping the table reverses exactly what this changeset built
-- changeset billing:002-create-invoices
-- => a second author in the same file: no coordination needed to share it
-- => the id sequence continues because order still comes from file position
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  -- => invoices get their own independent sequence of ids
  total_cents INTEGER NOT NULL
  -- => money as integer cents avoids floating-point rounding entirely
);

-- rollback DROP TABLE invoices;
-- => each changeset carries its own reverse, independent of its neighbours
