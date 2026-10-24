-- V002 continues the chain: each step appends exactly one row.
-- The runner sorts names, so 002 always follows 001.
INSERT INTO
  ex13_chain (step)
VALUES
  (2);

-- => one row per step keeps the final count equal to ten
