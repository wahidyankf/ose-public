-- 0002: three live-shaped rows. -- => old data the new column must absorb
INSERT INTO invoices (qty, price) -- => totals unknown at seed time
    VALUES (2, 500), -- => invoice 1: 2 at 500
    (1, 1999), -- => invoice 2: 1 at 1999
    (4, 250); -- => invoice 3: 4 at 250
