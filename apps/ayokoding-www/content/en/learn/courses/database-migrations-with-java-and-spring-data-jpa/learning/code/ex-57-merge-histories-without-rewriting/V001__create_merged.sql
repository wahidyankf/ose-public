-- V001 creates the table both sibling schemas migrate first.
-- The merge below unions ledgers, shared versions must carry identical bytes.
CREATE TABLE ex57_first (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the shared name both siblings assumed present
);
