-- 0004: twin every old value. -- => the data side of the reader move
UPDATE users -- => copy old values into the new home
    SET full_name = name WHERE full_name IS NULL; -- => guarded, like all good backfills
