-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-seed-parcels
-- => the seed changeset creates the table and inserts six unscored rows
-- => stable codes (not ids) address the rows the batches below score
CREATE TABLE parcels (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  code VARCHAR(20) NOT NULL,
  -- => codes are the stable batch keys; ids are never hardcoded
  score INTEGER
  -- => scores start NULL; each batch below fills its own two rows
);

INSERT INTO
  parcels (code)
VALUES
  ('B-1'),
  ('B-2'),
  ('B-3'),
  ('B-4'),
  ('B-5'),
  ('B-6');

-- => six seeded rows in three natural pairs for the three batches
-- rollback DROP TABLE parcels;
-- => dropping the table reverses the seed and every batch above it
-- changeset course:002-score-first-batch
-- => the first batch scores only the B-1 and B-2 rows
-- => a narrow WHERE keeps the locked row set small and brief
UPDATE parcels
SET
  score = 10
WHERE
  code IN ('B-1', 'B-2');

-- rollback UPDATE parcels SET score = NULL WHERE code IN ('B-1', 'B-2');
-- => nulling exactly the batch's rows reverses this batch alone
-- changeset course:003-score-second-batch
-- => the second batch scores only the B-3 and B-4 rows
-- => interruption between batches leaves completed bands committed
UPDATE parcels
SET
  score = 20
WHERE
  code IN ('B-3', 'B-4');

-- rollback UPDATE parcels SET score = NULL WHERE code IN ('B-3', 'B-4');
-- => each batch carries its own reverse, independent of its neighbours
-- changeset course:004-score-third-batch
-- => the third batch scores the final B-5 and B-6 rows
-- => three small commits beat one six-row lock for live tables
UPDATE parcels
SET
  score = 30
WHERE
  code IN ('B-5', 'B-6');

-- rollback UPDATE parcels SET score = NULL WHERE code IN ('B-5', 'B-6');
-- => the last batch reverses first when the release rolls back
