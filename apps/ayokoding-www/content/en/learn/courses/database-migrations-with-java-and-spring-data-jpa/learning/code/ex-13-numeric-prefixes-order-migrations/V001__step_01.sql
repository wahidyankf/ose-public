-- V001 starts a ten-step chain proving order past single digits.
-- Zero-padded prefixes keep lexical order equal to numeric order.
-- Every step records its version so the final print shows the sequence.
CREATE TABLE ex13_chain (id SERIAL PRIMARY KEY, step INTEGER NOT NULL);

-- => the chain table accumulates one row per migration step
INSERT INTO
  ex13_chain (step)
VALUES
  (1);

-- => step one lands with the table in the same transaction
