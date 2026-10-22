-- 0002: two customers to rename. -- => the rows every step must preserve
INSERT INTO customers (name) -- => full names unknown at seed time
    VALUES ('acme'), -- => customer 1
    ('globex'); -- => customer 2
