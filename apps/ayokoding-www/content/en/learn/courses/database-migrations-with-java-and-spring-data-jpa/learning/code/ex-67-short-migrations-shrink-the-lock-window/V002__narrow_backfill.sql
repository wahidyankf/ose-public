-- V002 seeds one row: its own file, its own short lock window.
INSERT INTO
  ex67_narrow (name)
VALUES
  ('first');

-- => one statement, one lock, one commit: the window stays tiny
