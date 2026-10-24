-- V001 creates the first table this course ever migrates.
-- One versioned file holds one change: a users table with a serial key.
-- The runner records this file in the history table in the same transaction.
CREATE TABLE ex01_users (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  username VARCHAR(50) NOT NULL
  -- => NOT NULL at creation keeps the first migration honest
);
