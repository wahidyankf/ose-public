-- V001 expands nicknames beside handles: phase one of two.
-- Each phase carries its own gate: this file must leave a nullable column.
CREATE TABLE ex42_members (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for members
  handle VARCHAR(100) NOT NULL,
  -- => the old name every deployed binary still writes
  nickname VARCHAR(100)
  -- => the new name, present but ungated until V002 proves it
);

-- => one member stands in for live traffic across both phases
INSERT INTO
  ex42_members (handle)
VALUES
  ('rider7');

-- => seeds share the migration transaction with the create above
