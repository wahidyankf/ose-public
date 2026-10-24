-- V001 creates widgets: rolled back and recreated in one program.
-- The ledger row goes away with the table, so forward can honestly rerun.
-- Keeping the row would make the next run skip a missing table.
CREATE TABLE ex21_widgets (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for widgets
  name VARCHAR(100) NOT NULL
  -- => the widget name recreated on the second forward pass
);
