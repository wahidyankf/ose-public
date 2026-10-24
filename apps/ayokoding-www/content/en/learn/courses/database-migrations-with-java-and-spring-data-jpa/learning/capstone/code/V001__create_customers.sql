-- V001 creates customers: the base the whole capstone builds upon.
CREATE TABLE cap_customers (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for customers
  name VARCHAR(100) NOT NULL
  -- => the customer name the golden query prints
);
