-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-bulletins
-- => the bridge changeset creates bulletins with both columns filled
-- => dual writes already ran, so old and new agree on every row here
CREATE TABLE bulletins (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  title VARCHAR(120) NOT NULL,
  -- => the old column, still read by the last old deploy until it retires
  body TEXT NOT NULL
  -- => the new column, fully bridged before the contract below runs
);

INSERT INTO
  bulletins (title, body)
VALUES
  ('Jadwal', 'Jadwal');

-- => one bridged row where old and new already agree
-- rollback DROP TABLE bulletins;
-- => dropping the table reverses the bridge and the contract together
-- changeset course:002-drop-title
-- => the contract changeset drops the old column last of all
-- => safe exactly now: no reader needs the old name anymore
ALTER TABLE bulletins
DROP COLUMN title;

-- rollback ALTER TABLE bulletins ADD COLUMN title VARCHAR(120);
-- => re-adding restores the structure but not the retired values
-- => contracts are one-way for data, which is why they run last
