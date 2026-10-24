-- V002 locks, extends, and commits as one atomic unit with its ledger row.
LOCK TABLE ex69_bounded IN SHARE ROW EXCLUSIVE MODE;

-- => the narrowest mode covering concurrent DDL protection for this alter
ALTER TABLE ex69_bounded
ADD COLUMN code VARCHAR(20);

-- => the DDL runs under the declared lock inside the migration transaction
INSERT INTO
  ex69_bounded (name, code)
VALUES
  ('first', 'f1');

-- => the seed shares the lock and the transaction: atomic all the way down
