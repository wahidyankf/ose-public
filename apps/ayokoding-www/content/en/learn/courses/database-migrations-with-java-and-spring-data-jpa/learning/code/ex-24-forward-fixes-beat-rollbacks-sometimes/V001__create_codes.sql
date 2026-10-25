-- V001 creates codes with a code column that turns out too short.
-- Rolling back would disturb nothing yet, but forward fix is the habit.
-- V002 corrects the length while history stays a straight line.
CREATE TABLE ex24_codes (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  code VARCHAR(4) NOT NULL
  -- => four characters prove too short, V002 widens without a rollback
);
