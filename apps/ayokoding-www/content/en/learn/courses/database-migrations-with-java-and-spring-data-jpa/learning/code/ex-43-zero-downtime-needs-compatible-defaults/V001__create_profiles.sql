-- V001 creates profiles with names only: old binaries write just this.
CREATE TABLE ex43_profiles (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for profiles
  name VARCHAR(100) NOT NULL
  -- => the only column old binaries know about
);
