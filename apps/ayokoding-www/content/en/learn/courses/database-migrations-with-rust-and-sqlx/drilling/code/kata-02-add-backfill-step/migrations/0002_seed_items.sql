-- 0002: two quantity-less rows. -- => the rows the backfill must cover
INSERT INTO items (name) -- => quantities unknown at seed time
    VALUES ('pen'), -- => item 1
    ('ink'); -- => item 2
