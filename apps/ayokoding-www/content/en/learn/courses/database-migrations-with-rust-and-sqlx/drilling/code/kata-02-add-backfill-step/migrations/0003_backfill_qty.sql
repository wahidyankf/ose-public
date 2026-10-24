-- 0003: fill every missing quantity. -- => guarded, rerunnable, complete
UPDATE items -- => only the still-missing rows change
    SET qty = 1 WHERE qty IS NULL; -- => the guard is the idempotence
