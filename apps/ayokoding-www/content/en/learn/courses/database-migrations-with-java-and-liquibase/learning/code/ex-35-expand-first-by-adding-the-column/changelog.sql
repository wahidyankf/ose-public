-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-articles
-- => the table changeset creates articles with the old title column only
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  title VARCHAR(120) NOT NULL
  -- => the old column the running application still reads and writes
);
INSERT INTO articles (title) VALUES ('Migrasi Tanpa Henti');
-- => one seeded row the expand below must carry over untouched

-- rollback DROP TABLE articles;
-- => dropping the table reverses the seed and the expand together

-- changeset course:002-add-body
-- => the expand changeset adds the body column, nullable and unused
-- => old code keeps running: it simply never reads the new column yet
ALTER TABLE articles ADD COLUMN body TEXT;

-- rollback ALTER TABLE articles DROP COLUMN body;
-- => dropping the column un-expands without touching the old column
