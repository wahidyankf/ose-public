-- V001 creates the library the closing sequence builds upon.
CREATE TABLE ex78_library (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  title VARCHAR(200) NOT NULL
  -- => the title the data migration below enriches
);

-- => two books stand in for the collection the course now closes
INSERT INTO
  ex78_library (title)
VALUES
  ('first folio'),
  ('second folio');

-- => seeds share the migration transaction with the create above
