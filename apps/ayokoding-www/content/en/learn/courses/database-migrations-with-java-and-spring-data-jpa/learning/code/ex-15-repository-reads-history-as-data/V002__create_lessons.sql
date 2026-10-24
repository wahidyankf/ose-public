-- V002 creates lessons referencing the courses above.
CREATE TABLE ex15_lessons (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for lessons
  course_id INTEGER NOT NULL REFERENCES ex15_courses (id),
  -- => the foreign key assumes courses exists: V001 first, always
  title VARCHAR(200) NOT NULL
  -- => the lesson title shown in the outline
);
