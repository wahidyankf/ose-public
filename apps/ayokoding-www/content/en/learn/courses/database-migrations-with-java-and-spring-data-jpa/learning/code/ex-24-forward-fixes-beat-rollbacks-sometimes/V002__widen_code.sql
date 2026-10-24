-- V002 widens the code column: the forward fix for V001's short column.
-- No rollback runs, every environment converges by moving forward only.
-- Linear history survives: 001 then 002, no gaps, no rewrites.
ALTER TABLE ex24_codes
ALTER COLUMN code TYPE VARCHAR(16);

-- => sixteen characters hold the longest real code with room to spare
