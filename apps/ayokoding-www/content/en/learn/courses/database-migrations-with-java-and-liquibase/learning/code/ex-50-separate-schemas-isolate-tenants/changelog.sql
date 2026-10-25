-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-tenant-schemas
-- => one changeset houses both tenants with identical invoice tables
-- => schema-qualified names keep the twins disjoint from birth
CREATE SCHEMA tenant_a;

CREATE SCHEMA tenant_b;

-- => both schemas exist before either table references them below
CREATE TABLE tenant_a.invoices (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  total_cents INTEGER NOT NULL
  -- => tenant_a's row below never leaks into tenant_b's table
);

CREATE TABLE tenant_b.invoices (
  id SERIAL PRIMARY KEY,
  -- => twin tables share names but never share rows across schemas
  total_cents INTEGER NOT NULL
  -- => tenant_b's row below never leaks into tenant_a's table
);

INSERT INTO
  tenant_a.invoices (total_cents)
VALUES
  (1000);

INSERT INTO
  tenant_b.invoices (total_cents)
VALUES
  (2000);

-- => one seeded row per tenant: the isolation the program recounts
-- rollback DROP SCHEMA tenant_a CASCADE;
-- rollback DROP SCHEMA tenant_b CASCADE;
-- => cascading drops reverse both schemas with their tables and rows
