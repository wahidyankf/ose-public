-- V001 expands players with display_handle beside the old handle.
-- Expand: the new name exists before anything writes it.
CREATE TABLE ex38_players (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for players
  handle VARCHAR(100) NOT NULL,
  -- => the old name every deployed binary still writes
  display_handle VARCHAR(100)
  -- => the new name, present but unused until the migrate phase
);

-- => one player stands in for live traffic across the rename
INSERT INTO
  ex38_players (handle, display_handle)
VALUES
  ('striker9', NULL);

-- => the old write path works unchanged with the new column present
