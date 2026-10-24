-- V001 creates sessions with last-seen dates around the retention cutoff.
-- Old rows stand in for expired data, fresh rows must survive the expiry.
CREATE TABLE ex31_sessions (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for sessions
  seen_on DATE NOT NULL
  -- => the date the expiry predicate in V002 compares against
);

-- => one old and one fresh session bracket the retention cutoff
INSERT INTO
  ex31_sessions (seen_on)
VALUES
  (CURRENT_DATE - 90),
  (CURRENT_DATE);

-- => the old row expires below, the fresh row must survive it
