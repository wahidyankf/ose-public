-- V001 creates courses: the first row the repository will read back.
-- History as data means existsById and findAll answer diagnosis questions.
CREATE TABLE ex15_courses (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for courses
  title VARCHAR(200) NOT NULL
  -- => the course title shown in the catalog
);
