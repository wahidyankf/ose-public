-- 0002 slow: one row, deliberately delayed. -- => the sleep makes the race real
SELECT pg_sleep(1); -- => one slow second under the advisory lock
INSERT INTO squads (name) -- => the row the race must insert once
    VALUES ('first'); -- => the single recorded squad
