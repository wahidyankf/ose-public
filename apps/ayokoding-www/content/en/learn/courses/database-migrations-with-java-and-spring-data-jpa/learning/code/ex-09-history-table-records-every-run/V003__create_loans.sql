-- V003 creates loans: the third ledger entry in order.
-- Three files, three rows: the ledger mirrors the file list exactly.
-- Any gap between files and rows is drift, covered in Example 48.
CREATE TABLE ex09_loans (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for loans
  shelf_id INTEGER NOT NULL REFERENCES ex09_shelves (id)
  -- => the foreign key assumes shelves migrated first, as V002 did
);
