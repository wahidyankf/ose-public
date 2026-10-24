-- V001 creates patrons with a name reviewers recognize instantly.
-- Good descriptions survive longer than anyone's memory of the deploy.
CREATE TABLE ex17_patrons (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for patrons
  name VARCHAR(100) NOT NULL
  -- => the patron name shown at checkout
);
