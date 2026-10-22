-- 0003: slow enough to race. -- => the sleep holds the lock open
SELECT pg_sleep(1); -- => one slow second under the advisory lock
UPDATE invoices -- => rewrite old rows into the new shape
    SET total = qty * price WHERE total IS NULL; -- => guarded, applied exactly once
