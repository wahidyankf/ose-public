-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- changeset course:002-create-products
-- => author "course", id "002-create-products": a distinct second identity
-- => included automatically because it sits in the scanned directory
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  -- => same key shape as users, so later joins stay simple
  name VARCHAR(255) NOT NULL
  -- => products need longer names than usernames allow
);

-- rollback DROP TABLE products;
-- => reverse order on rollback: products drops before users
