-- V001 expands members with nickname beside the old handle.
CREATE TABLE kata06_members (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for members
  handle VARCHAR(100) NOT NULL,
  -- => the old name deployed binaries still write
  nickname VARCHAR(100)
  -- => the new name, present but unused until the migrate phase
);

-- => one member stands in for live traffic across the split
INSERT INTO
  kata06_members (handle)
VALUES
  ('rider7');

-- => seeds share the migration transaction with the create above
