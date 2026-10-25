-- 0003: the opening day, seeded. -- => real-shaped rows the evolution must keep
INSERT INTO customers (name) -- => the shop opens with two customers
    VALUES ('ada'), -- => customer 1
    ('grace'); -- => customer 2
INSERT INTO orders (customer_id, total) -- => three opening orders
    VALUES (1, 100), -- => ada's first order
    (1, 250), -- => ada's second order
    (2, 400); -- => grace's order
