-- V001 creates subscribers with mixed-case emails needing normalization.
-- The shape is already right, only the values need a migration.
CREATE TABLE ex32_subscribers (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for subscribers
  email VARCHAR(200) NOT NULL
  -- => mixed case in, lowercase out: V002 normalizes without DDL
);

-- => mixed-case seeds stand in for years of unnormalized signups
INSERT INTO
  ex32_subscribers (email)
VALUES
  ('Ada@Example.COM'),
  ('GRACE@example.com');

-- => seeds share the migration transaction with the create above
