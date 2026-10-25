-- 0002: two nick-less rows. -- => the rows the backfill must fill exactly once
INSERT INTO gamers DEFAULT VALUES; -- => gamer 1: no nick
INSERT INTO gamers DEFAULT VALUES; -- => gamer 2: no nick
