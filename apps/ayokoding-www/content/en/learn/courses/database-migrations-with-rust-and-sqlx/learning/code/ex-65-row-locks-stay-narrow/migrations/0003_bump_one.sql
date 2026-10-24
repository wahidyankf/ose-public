-- 0003: keyed updates lock one row. -- => primary-key predicates stay narrow
UPDATE counters -- => only the matching row locks
    SET value = value + 10 WHERE id = 2; -- => the narrow blast radius, stated plainly
