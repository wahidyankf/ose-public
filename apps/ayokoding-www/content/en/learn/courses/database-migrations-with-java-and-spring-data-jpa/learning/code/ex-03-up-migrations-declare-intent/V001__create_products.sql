-- V001 creates the products table this example grows.
-- Up files declare forward intent: what the schema gains, in DDL.
-- A matching down file can reverse this change, Example 18 shows how.
CREATE TABLE ex03_products (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for products
  name VARCHAR(100) NOT NULL
  -- => the name ships first, the price arrives in V002
);
