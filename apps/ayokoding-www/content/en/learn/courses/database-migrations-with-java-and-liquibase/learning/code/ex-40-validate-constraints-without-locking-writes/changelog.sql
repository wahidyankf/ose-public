-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-seed-orders
-- => the seed changeset creates orders with one honest positive row
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  total_cents INTEGER NOT NULL
  -- => the seeded total already satisfies the rule below
);

INSERT INTO
  orders (total_cents)
VALUES
  (5000);

-- => one seeded row the validation step must accept, never reject
-- rollback DROP TABLE orders;
-- => dropping the table reverses the seed and the rule together
-- changeset course:002-add-rule-not-valid
-- => the rule changeset guards new writes without scanning old rows
-- => NOT VALID skips the table scan, so writers never block on this deploy
ALTER TABLE orders ADD CONSTRAINT ck_orders_total_positive CHECK (total_cents > 0) NOT VALID;

-- rollback ALTER TABLE orders DROP CONSTRAINT ck_orders_total_positive;
-- => dropping the rule reverses exactly what this changeset added
-- changeset course:003-validate-rule
-- => the validation changeset checks old rows under a weaker lock
-- => writes continue during validation; only the rule's promise waits
ALTER TABLE orders VALIDATE CONSTRAINT ck_orders_total_positive;

-- rollback SELECT 1;
-- => validation leaves no schema object behind, so its reverse is a no-op
-- => the SELECT keeps the rollback block syntactically present but inert
