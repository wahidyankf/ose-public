-- 0002: two handle-less rows. -- => the nulls the backfill must empty
INSERT INTO profiles DEFAULT VALUES; -- => profile 1: no handle
INSERT INTO profiles DEFAULT VALUES; -- => profile 2: no handle
