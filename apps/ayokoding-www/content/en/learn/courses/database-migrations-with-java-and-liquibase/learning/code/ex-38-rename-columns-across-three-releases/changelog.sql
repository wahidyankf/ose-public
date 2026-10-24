-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-members
-- => release one starts with the old name column and one seeded row
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => the old name every running deploy still reads
);
INSERT INTO members (name) VALUES ('budi');
-- => one seeded row the migrate step below will copy

-- rollback DROP TABLE members;
-- => dropping the table reverses all three releases together

-- changeset course:002-expand-display-name
-- => release two expands: the new column lands beside the old one
ALTER TABLE members ADD COLUMN display_name VARCHAR(60);

-- rollback ALTER TABLE members DROP COLUMN display_name;
-- => dropping the new column un-expands back to the old name alone

-- changeset course:003-migrate-and-contract
-- => release three migrates the value, then contracts the old column
UPDATE members SET display_name = name;
-- => the copy must land before the drop below removes the source
ALTER TABLE members DROP COLUMN name;
-- => the old name goes only after its value safely moved across

-- rollback ALTER TABLE members ADD COLUMN name VARCHAR(60);
-- => re-adding restores the structure but not the retired values
