-- V001 creates the claims table the reservation protocol writes to.
CREATE TABLE ex61_claims (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the shared base the claimed versions extend
);
