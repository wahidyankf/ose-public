-- V001 creates the catalog the branch comparison below measures.
CREATE TABLE ex55_catalog (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the catalog name branches copy and compare
);
