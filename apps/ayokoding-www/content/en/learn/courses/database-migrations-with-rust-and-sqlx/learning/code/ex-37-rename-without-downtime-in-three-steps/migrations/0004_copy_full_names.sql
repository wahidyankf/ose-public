-- 0004 step two: twin every value. -- => the copy, safe alone
UPDATE customers -- => copy old values into the new home
    SET full_name = name WHERE full_name IS NULL; -- => guarded, like all good backfills
