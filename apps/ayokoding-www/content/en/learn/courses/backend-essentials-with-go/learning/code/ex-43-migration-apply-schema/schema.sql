-- Example 43: the schema lives in its own .sql file, not inline Go.
-- The same file could be handed to `sqlite3 tasks.db < schema.sql` on a shell.
CREATE TABLE IF NOT EXISTS tasks ( -- => co-15: begins the single-table DDL statement
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- => co-15: ids only ever go up, never get reused
  title TEXT NOT NULL -- => co-15: the one column this migration creates
);
