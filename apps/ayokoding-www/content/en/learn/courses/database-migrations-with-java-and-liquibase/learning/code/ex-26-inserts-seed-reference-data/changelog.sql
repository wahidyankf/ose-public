-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-cultivars
-- => the structure changeset creates the cultivars table with no rows yet
-- => seeds arrive separately below, reviewable beside this structure
CREATE TABLE cultivars (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => cultivar names are required from the first migration
);

-- rollback DROP TABLE cultivars;
-- => dropping the table reverses exactly what this changeset built

-- changeset course:002-seed-cultivars
-- => the data changeset inserts exactly three reference rows
-- => reruns skip it as applied, so the rows never duplicate
INSERT INTO cultivars (name) VALUES ('arabica'), ('robusta'), ('liberica');

-- rollback DELETE FROM cultivars;
-- => the declared delete removes exactly the rows this changeset added
