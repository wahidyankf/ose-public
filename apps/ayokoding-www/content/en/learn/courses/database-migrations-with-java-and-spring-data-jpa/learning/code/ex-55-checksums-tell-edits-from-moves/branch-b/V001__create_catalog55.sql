-- V001 creates the catalog: edited in branch B after the split.
-- One comment differs from the applied file: the checksum must catch it.
CREATE TABLE ex55_catalog (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer for catalog rows
  name VARCHAR(100) NOT NULL
  -- => the catalog name branches copy and compare
);
