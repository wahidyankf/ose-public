-- V009 ends single digits: the next file tests the 09 to 10 boundary.
INSERT INTO
  ex13_chain (step)
VALUES
  (9);

-- => one row per step keeps the final count equal to ten
