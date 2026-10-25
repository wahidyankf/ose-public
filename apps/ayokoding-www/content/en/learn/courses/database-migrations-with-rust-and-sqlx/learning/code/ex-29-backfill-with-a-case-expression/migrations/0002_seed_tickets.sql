-- 0002: one ticket per priority. -- => every mapping branch gets exercised
INSERT INTO tickets (priority) -- => labels unknown at seed time
    VALUES (1), -- => ticket 1: low
    (2), -- => ticket 2: medium
    (3); -- => ticket 3: high
