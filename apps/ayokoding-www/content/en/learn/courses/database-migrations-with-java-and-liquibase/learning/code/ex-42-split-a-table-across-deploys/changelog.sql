-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-wide-orders
-- => the wide table ships first with order headers and lines together
CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  customer VARCHAR(60) NOT NULL,
  -- => the header half of each row stays on this table after the split
  item VARCHAR(60) NOT NULL
  -- => the line half below moves out into its own table
);

INSERT INTO
  purchase_orders (customer, item)
VALUES
  ('budi', 'kopi'),
  ('sari', 'teh');

-- => two wide rows the split below copies line by line
-- rollback DROP TABLE purchase_orders;
-- => dropping the table reverses the seed and the split together
-- changeset course:002-split-lines-out
-- => the split creates the lines table and copies every line across
CREATE TABLE order_lines (
  id SERIAL PRIMARY KEY,
  -- => lines get their own independent sequence of ids
  order_id INTEGER NOT NULL REFERENCES purchase_orders (id),
  -- => the foreign key keeps each copied line attached to its header
  item VARCHAR(60) NOT NULL
  -- => the copied item text the verification below recounts
);

INSERT INTO
  order_lines (order_id, item)
SELECT
  id,
  item
FROM
  purchase_orders;

-- => INSERT SELECT copies all rows in one statement, nothing hand-moved
-- rollback DROP TABLE order_lines;
-- => dropping the new table un-splits back to the wide shape alone
