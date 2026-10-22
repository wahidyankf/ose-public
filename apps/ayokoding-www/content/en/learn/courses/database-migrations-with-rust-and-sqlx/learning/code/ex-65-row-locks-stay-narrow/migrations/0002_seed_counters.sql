-- 0002: three zeroed rows. -- => the neighbors the update must not touch
INSERT INTO counters DEFAULT VALUES; -- => counter 1
INSERT INTO counters DEFAULT VALUES; -- => counter 2, the bump target
INSERT INTO counters DEFAULT VALUES; -- => counter 3
