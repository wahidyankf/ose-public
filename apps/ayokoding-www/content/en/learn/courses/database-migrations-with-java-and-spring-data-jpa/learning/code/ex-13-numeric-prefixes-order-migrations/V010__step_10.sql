-- V010 proves zero-padding: 010 sorts after 009, never after 001.
-- Without padding, V10 would run second and break every later step.
INSERT INTO
  ex13_chain (step)
VALUES
  (10);

-- => ten rows total prove all ten steps ran in numeric order
