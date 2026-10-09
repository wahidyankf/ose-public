-- Example 61: both the schema change and version marker commit together or roll back together.
BEGIN IMMEDIATE;
                                    -- => starts a write transaction before any schema change
ALTER TABLE book ADD COLUMN edition INTEGER DEFAULT 1;
                                    -- => the additive change, identical in shape to Example 59

-- PRAGMA user_version stores a plain integer INSIDE the database file's header (co-24) --
-- no extra "schema_migrations" table needed to remember which migration already ran.
PRAGMA user_version = 1;
COMMIT;
                                    -- => interruption before COMMIT leaves version 0 and no edition
