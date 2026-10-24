-- V001 creates articles: the table the next migration will index.
-- Tables and their indexes ship as separate migrations, not one bundle.
-- Separate files stay independently reviewable and reversible.
CREATE TABLE ex07_articles (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for articles
  author VARCHAR(100) NOT NULL,
  -- => the author column is the query path V002 will index
  title VARCHAR(200) NOT NULL
  -- => titles ride along, the index targets authors only
);
