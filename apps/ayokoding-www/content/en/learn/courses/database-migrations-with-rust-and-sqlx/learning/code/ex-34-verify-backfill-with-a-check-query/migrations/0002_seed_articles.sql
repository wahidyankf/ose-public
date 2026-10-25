-- 0002: two titled rows. -- => the rows the backfill must cover
INSERT INTO articles (title) -- => slugs unknown at seed time
    VALUES ('Hello World'), -- => article 1
    ('Rust Wins'); -- => article 2
