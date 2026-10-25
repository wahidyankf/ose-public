-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-coupons
-- => the first table changeset creates coupons with no rows yet
CREATE TABLE coupons (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  code VARCHAR(20) NOT NULL
  -- => coupon codes identify the batch the insert below adds
);

-- rollback DROP TABLE coupons;
-- => this reverse never runs here; only the data changes roll back
-- changeset course:002-make-prices
-- => the second table changeset creates prices with one seeded row
CREATE TABLE prices (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  amount_cents INTEGER NOT NULL
  -- => the seeded price the correction below will change and restore
);

INSERT INTO
  prices (amount_cents)
VALUES
  (5000);

-- => one seeded row at the original value the strategies must restore
-- rollback DROP TABLE prices;
-- => this reverse never runs here either; tables outlive data reverses
-- changeset course:003-batch-coupons
-- => strategy one: an inserted batch reverses with a matching delete
INSERT INTO
  coupons (code)
VALUES
  ('HEMAT-10'),
  ('HEMAT-20');

-- rollback DELETE FROM coupons;
-- => the delete removes exactly the batch this changeset inserted
-- changeset course:004-correct-price
-- => strategy two: a corrected value reverses with a compensating update
UPDATE prices
SET
  amount_cents = 7500
WHERE
  amount_cents = 5000;

-- rollback UPDATE prices SET amount_cents = 5000 WHERE amount_cents = 7500;
-- => the compensating update writes back the exact original value
