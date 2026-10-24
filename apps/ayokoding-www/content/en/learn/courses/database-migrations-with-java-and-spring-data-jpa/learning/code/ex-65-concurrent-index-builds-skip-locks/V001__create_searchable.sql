-- V001 creates the searchable table the concurrent index below serves.
CREATE TABLE ex65_searchable (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  title VARCHAR(200) NOT NULL
  -- => the title the concurrent index will serve
);

-- => two hundred rows make the index build do real work
INSERT INTO
  ex65_searchable (title)
SELECT
  'title ' || g
FROM
  generate_series (1, 200) g;

-- => volume stands in for a production table that cannot stop for DDL
