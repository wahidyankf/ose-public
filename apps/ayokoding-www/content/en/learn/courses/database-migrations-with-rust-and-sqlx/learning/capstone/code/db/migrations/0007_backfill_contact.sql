-- 0007: twin the names, derive the emails. -- => the data side of the rename
UPDATE customers -- => copy old values into the new home
    SET full_name = name, email = lower(name) || '@example.com' WHERE full_name IS NULL; -- => guarded twins plus derived contact
