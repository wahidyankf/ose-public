-- Example 1: Create Author Table.
-- CREATE TABLE declares a new relation (co-07): a name, a column list, and constraints.
CREATE TABLE author(
    id INTEGER PRIMARY KEY,        -- => INTEGER PRIMARY KEY aliases SQLite's rowid (co-02)
                                    -- => the engine auto-assigns this on insert -- no id needed
    name TEXT NOT NULL             -- => TEXT column; NOT NULL forbids a missing name value
);

-- .schema prints SQLite's stored definition (which may normalize the original SQL).
-- NOTE: dot-commands take the rest of their line as arguments -- no trailing "--" comment here.
.schema author
