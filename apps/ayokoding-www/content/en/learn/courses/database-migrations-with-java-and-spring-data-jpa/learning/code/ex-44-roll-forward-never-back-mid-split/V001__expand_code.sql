-- V001 expands items with a code beside the legacy sku.
CREATE TABLE ex44_items (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for items
  sku VARCHAR(50) NOT NULL,
  -- => the legacy identifier the migrate phase reads from
  code VARCHAR(50)
  -- => the new identifier, filled by V002 and completed by V003
);

-- => three items stand in for a split caught halfway
INSERT INTO
  ex44_items (sku)
VALUES
  ('a-1'),
  ('b-2'),
  ('c-3');

-- => seeds share the migration transaction with the create above
